/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Generic line/area chart
 */
Ext.define('App.util.d3.LineChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	canvasWidth: 400,
	canvasHeight: 400,
	
	gCanvas: null,
	gLabel: null,
	gMarker: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	multiLine: false,
	margins: {
		top: 20,
		right: 10,
		bottom: 90,
		left: 90
	},
	fillArea: false,
	panelId: null,
	chartTitle: '',
 	strokeColor: '#0000FF',
	fillColor: '#FFFFCC',
	interpolate: 'linear',
		// linear, step-before, step-after, basis, basis-open, basis-closed,
		// bundle, cardinal, cardinal-open, cardinal-closed, monotone
		
	showLabels: true,
	labelClass: 'labelText',
	labelSkipCount: 1,		// every 2nd, 3rd, 4th, etc.
	labelFunction: function(data, index) {
		return 'label';
	},
	
	showMarkers: true,
	markerFillColor: '#FFCC33',
	markerStrokeColor: '#333333',
	markerStrokeWidth: 1,
	markerRadius: 4,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	// x stuff
	xAxis: null,
	xDataMetric: null,
	xTicks: 7,
	xTickFormat: function(d) {
		return d;
	},
	xScalePadding: 0,
	
	// y stuff
	yAxis: null,
	yDataMetric: null,
	yTicks: 12,
	yTickFormat: function(d) {
		return d;
	},
	yScalePadding: 0,
	
 	/**
  	 * line/area holders
  	 */
  	canvasLine: null,
  	canvasArea: null,
	
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
	},
	
	/**
 	 * @function
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check (1)
		//////////////////////////////////////////////////
		if(me.svg == null || me.xDataMetric == null || me.yDataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// sanity check (2)
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) { return; }
		
		//////////////////////////////////////////////////
		// set "g" elements
		//////////////////////////////////////////////////
		me.gCanvas = me.svg.append('svg:g');
		me.gLabel = me.svg.append('svg:g');
		me.gMarker = me.svg.append('svg:g');
		me.gXAxis = me.svg.append('svg:g');
		me.gYAxis = me.svg.append('svg:g');
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
			
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		me.setLineAreaFn();
		
		//////////////////////////////////////////////////
		// bring ExtJS variables
		// into local scope for use in D3
		//////////////////////////////////////////////////
		var xScale = me.xScale,
			xAxis = me.xAxis,
			yScale = me.yScale,
			yAxis = me.yAxis,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			xDataMetric = me.xDataMetric,
			yDataMetric = me.yDataMetric,
			margins = me.margins,
			graphData = me.graphData,
			canvasLine = me.canvasLine,
			canvasArea = me.canvasArea,
			fillColor = me.fillColor,
			fillArea = me.fillArea;
			
		//////////////////////////////////////////////////
		// generate the line/area
		//////////////////////////////////////////////////
		me.gCanvas.append('path')
			.datum(me.graphData)
			.style('fill', function(d) {
				if(fillArea) {
					return me.fillColor;
				}
				return 'none'
			})
			.style('stroke-width', 1)
			.style('stroke', me.strokeColor)
			.attr('d', function(d, i) {
				if(fillArea) {
					return canvasArea(d, i);
				}
				return canvasLine(d, i);
			});
		
		//////////////////////////////////////////////////
		// handle markers, chart title
		//////////////////////////////////////////////////
		me.handleLabels();
		me.handleMarkers();
		me.handleChartTitle();
		
		//////////////////////////////////////////////////
		// axis modifications
		//////////////////////////////////////////////////
		var xAxTrans = canvasHeight - margins.bottom;
		me.gXAxis.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + xAxTrans + ')');
		me.gYAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.left + ', 0)');
		me.callAxes();
	},
	
	/**
 	 * @function
 	 */
 	transition: function() {
 		var me = this;

		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		me.setLineAreaFn();		// most occur after X/Y scale setting
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var yScale = me.yScale,
			xScale = me.xScale,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			graphData = me.graphData,
			xDataMetric = me.xDataMetric,
			yDataMetric = me.yDataMetric,
			canvasLine = me.canvasLine,
			canvasArea = me.canvasArea,
			fillColor = me.fillColor,
			fillArea = me.fillArea;
			
		//////////////////////////////////////////////////
		// transition the line/area
		//////////////////////////////////////////////////
		me.gCanvas.selectAll('path')
			.datum(me.graphData)
			.style('fill', function(d) {
				if(fillArea) {
					return fillColor;
				}
				return 'none'
			})
			.style('stroke-width', 1)
			.style('stroke', me.strokeColor)
			.transition()
			.duration(250)
			.attr('d', function(d, i) {
				if(fillArea) {
					return canvasArea(d, i);
				}
				return canvasLine(d, i);
			});
		
		//////////////////////////////////////////////////
		// handle markers, chart title, axes
		//////////////////////////////////////////////////
		me.handleLabels();
		me.handleMarkers();
		me.handleChartTitle();
		me.callAxes();
 	},
 	
 	/**
  	 * @function
  	 * @description Simultaneously setting the line and area functions
  	 */
 	setLineAreaFn: function() {
	 	var me = this;
	 	
	 	var xScale = me.xScale,
		 	xDataMetric = me.xDataMetric,
	 		yDataMetric = me.yDataMetric,
	 		yScale = me.yScale;

		me.canvasLine = d3.svg.line()
			.interpolate(me.interpolate)
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y(function(d) { return yScale(d[yDataMetric]); });
			
		me.canvasArea = d3.svg.area()
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y0(me.canvasHeight - me.margins.bottom)
			.y1(function(d) { return yScale(d[yDataMetric]); });
	},
 	
 	/**
  	 * @function
  	 * @description Handle labels
  	 */
  	handleLabels: function() {
  		var me = this;
  		
  		// extinguish (kesu)
  		if(!me.showLabels) {
	  		me.gLabel.selectAll('text').remove();
	  		return;
	  	}
  		
  		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric,
  			markerRadius = me.markerRadius,
  			labelSkipCount = me.labelSkipCount;
  			
  		// join new with old
  		var labelSelection = me.gLabel.selectAll('text')
	  		.data(me.graphData);
	  		
	  	// transition out old
	  	labelSelection.exit()
		  	.transition()
		  	.duration(250)
		  	.attr('x', -200)
		  	.remove();
		
		// add new
		labelSelection.enter()
			.append('text')
			.attr('class', me.labelClass)
			.attr('text-anchor', 'start');
			
		// transition all
		labelSelection.transition()
			.duration(250)
			.attr('x', function(d, i) {
				return xScale(d[xDataMetric]) - (markerRadius * 4);
			})
			.attr('y', function(d) {
				return yScale(d[yDataMetric]) - (markerRadius * 3);
			})
			.text(function(d, i) {
				if(labelSkipCount > 1) {
					if(i> 0 && i % labelSkipCount == 0) {
						return me.labelFunction(d, i);
					}
					return '';
				} else {
					return me.labelFunction(d, i);
				}
			});
  	},
 	
 	/**
  	 * @function
  	 * @description Handle the circle markers on the paths
  	 */
  	handleMarkers: function() {
  		var me = this;
  		
  		// extinguish (kesu)
  		if(!me.showMarkers) {
  			me.gMarker.selectAll('circle').remove();
  			return;
  		}
  		
  		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric,
  			markerRadius = me.markerRadius;
  			
  		// join new with old
  		var markerSelection = me.gMarker.selectAll('circle')
	  		.data(me.graphData);
	  		
	  	// transition out old
	  	markerSelection.exit()
		  	.transition()
		  	.duration(250)
		  	.attr('width', 0)
		  	.remove();
		  	
		// add new
		markerSelection.enter()
			.append('circle')
			.attr('r', me.markerRadius)
			.style('fill', me.markerFillColor)
			.style('stroke', me.markerStrokeColor)
			.style('stroke-width', me.markerStrokeWidth)
			.on('mouseover', function(d, i) {
				d3.select(this).transition().duration(0).attr('r', function() {
					return markerRadius * 3;
				});
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.transition()
					.duration(250)
					.attr('r', markerRadius)
					.ease('bounce');
			});
			
		// transition all
		markerSelection.transition()
			.duration(250)
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			});
		
		// call the tooltip helper
		markerSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
 	
 	/**
  	 * @function
  	 * @description Handle generation/transition of the chart title
  	 */
 	handleChartTitle: function() {
 		var me = this;
 		
 		me.gTitle.selectAll('text').remove();
 		
 		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	},
	
 	/**
 	 * @function
 	 * @description Call the X/Y axes generation/transition functions
 	 */
 	callAxes: function() {
	 	var me = this;
	 	me.gXAxis.call(me.xAxis);
		me.gYAxis.call(me.yAxis);
	},
	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.Scatterplot
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 */
	setXScale: function(metric) {
		var me = this;
		
		me.xScale = d3.scale.linear()
			.domain([
				d3.min(me.graphData, function(d) { return d[metric]; }),
				d3.max(me.graphData, function(d) { return d[metric]; })
			])
			.range([
				me.margins.left,
				me.canvasWidth - me.margins.right
			]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.orient('bottom')
			.ticks(me.xTicks)
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.Scatterplot
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 */
	setYScale: function(metric) {
		var me = this;
		
		var yScalePadding = me.yScalePadding;
			
		me.yScale = d3.scale.linear()
			.domain([
				0,
				d3.max(me.graphData, function(d) { return d[metric] + yScalePadding })
			])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.margins.top
			]);
			

		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.orient('left')
			.ticks(me.yTicks)
			.tickFormat(me.yTickFormat);	
	},
	
	/**
 	 * SETTERS
 	 */
 	setFillArea: function(bool) {
	 	var me = this;
	 	
	 	me.fillArea = bool;
	},
	
	setXDataMetric: function(metric) {
		var me = this;
		
		me.xDataMetric = metric;
	},
	
	setYDataMetric: function(metric) {
		var me = this;
		
		me.yDataMetric = metric;
	},
	
	setXTickFormat: function(fn) {
		var me = this;
		
		me.xTickFormat = fn;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		
		me.yTickFormat = fn;
	},
	
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	},
	
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	setXScalePadding: function(num) {
		var me = this;
		
		me.xScalePadding = num;
	},
	
	setYScalePadding: function(num) {
		var me = this;
		
		me.yScalePadding = num;
	},
	
	setFillColor: function(color) {
		var me = this;
		
		me.fillColor = color;
	},
	
	setStrokeColor: function(color) {
		var me = this;
		
		me.strokeColor = color;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		
		me.showLabels = bool;
	}
});