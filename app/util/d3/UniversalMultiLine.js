/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Multiple line/series chart
 */
Ext.define('App.util.d3.UniversalMultiLine', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,

  	canvasArea: null,
	canvasHeight: 400,
	canvasLine: null,
	canvasWidth: 400,
	chartInitialized: false,
	chartTitle: null,
	currentMinX: null,
	currentMinY: null,
	currentMaxX: null,
	currentMaxY: null,
	dataBin: [],
	fillColor: '#FFFFCC',
	
	gCanvas: null,
	gGrid: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	interpolate: 'linear',
		// linear, step-before, step-after, basis, basis-open, basis-closed,
		// bundle, cardinal, cardinal-open, cardinal-closed, monotone
	labelClass: 'labelText',
	labelFunction: function(data, index) {
		return 'label';
	},
	labelSkipCount: 1,		// every 2nd, 3rd, 4th, etc.
	margins: {
		top: 20,
		right: 10,
		bottom: 90,
		left: 90
	},
	markerRadius: 6,
	panelId: null,
	showGrid: true,
	showLabels: true,
	showMarkers: true,
 	strokeColor: '#0000FF',
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	xAxis: null,
	xDataMetric: null,
	xTicks: 7,
	xTickFormat: function(d) {
		return d;
	},
	xScalePadding: 0,
	
	yAxis: null,
	yDataMetric: null,
	yTicks: 12,
	yTickFormat: function(d) {
		return d;
	},
	yScalePadding: 0,
	
	/**
 	 * @constructor
 	 */
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
 	 * @description Initialize chart components
 	 */
 	initChart: function() {
	 	var me = this;
	 	
	 	var xAxTrans = me.canvasHeight - me.margins.bottom;

	 	me.gCanvas = me.svg.append('svg:g');
	 	
	 	me.gGrid = me.svg.append('svg:g');
	 	
	 	me.gXAxis = me.svg.append('svg:g')
		 	.attr('class', 'axis')
		 	.attr('transform', 'translate(0, ' + xAxTrans + ')');
	 	
	 	me.gYAxis = me.svg.append('svg:g')
	 		.attr('class', 'axis')
	 		.attr('transform', 'translate(' + me.margins.left + ', 0)');
	 	
	 	me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
				+ parseInt(me.canvasWidth/2)
				+ ','
				+ parseInt(me.margins.top/2)
				+ ')');
				
		me.chartInitialized = true;
		
		return me;
	},
	
	/**
 	 * @function
 	 * @description Append series to chart
 	 * @param data Object
 	 */
 	appendSeries: function(data) {
	 	var me = this;
	 	
	 	me.dataBin.push(data);
	 	
	 	////////////////////////////////////////
	 	// sanity check
	 	////////////////////////////////////////
	 	if(me.svg == null || !me.chartInitialized
		 	|| me.xDataMetric == null || me.yDataMetric == null) {
		 	
		 	Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric, data);
		me.setYScale(me.yDataMetric, data);
		me.setLineAreaFn();
		me.callAxes();

		// transition existing "g->series" elements
		me.transitionExisting();
		
		// append the new series data
		var seriesG = me.gCanvas.append('svg:g')
			.attr('class', 'series'),
			randomHexColor = me.generateRandomHexColor();
			
		seriesG.append('path')
			.datum(data)
			.style('fill', 'none')
			.style('stroke-width', 1)
			.style('stroke', '#' + randomHexColor)
			.attr('d', me.canvasLine);
			
		//////////////////////////////////////////////////
		// remaining handlers
		//////////////////////////////////////////////////
		me.appendMarkers(seriesG, data);
		me.handleChartTitle();
		me.handleGrid();
 	},
 	
 	/**
 	 * @function
 	 * @description Append markers (circles) to a particular "g" element
 	 * @param gEl <svg:g>
 	 * @param data Object[]
 	 */
 	appendMarkers: function(gEl, data) {
	 	var me = this;
		
		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric,
  			markerRadius = me.markerRadius;
  			
  		gEl.selectAll('circle')
	  		.data(data)
	  		.enter()
	  		.append('circle')
	  		.attr('cx', function(d) {
		  		return xScale(d[xDataMetric]);
		  	})
		  	.attr('cy', function(d) {
			  	return yScale(d[yDataMetric]);
			 })
			.attr('r', me.markerRadius)
			.style('fill', me.fillColor)
			//.style('fill', '#' + me.generateRandomHexColor())
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {
				d3.select(this)
					.transition()
					.duration(0)
					.attr('r', function() {
						return markerRadius * 3;
					});
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.transition()
					.duration(250)
					.attr('r', markerRadius)
					.ease('bounce');
			})
			.call(d3.helper.tooltip().text(me.tooltipFunction));
 	},
 	
 	/**
  	 * @function
  	 * @description Transition existing lines/markers
  	 */
 	transitionExisting: function() {
	 	var me = this;
	 	
	 	var xScale = me.xScale,
		 	yScale = me.yScale,
		 	xDataMetric = me.xDataMetric,
		 	yDataMetric = me.yDataMetric;
	 	
		me.gCanvas.selectAll('g .series path').attr('d', me.canvasLine);
		
		me.gCanvas.selectAll('g .series circle')
			.transition()
			.duration(250)
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			});
	},
	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.MultiLineChart
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 * @param data Object[]
 	 */
	setXScale: function(metric, data) {
		var me = this;
		
		var xMin = d3.min(data, function(d) { return d[metric]; });
		var xMax = d3.max(data, function(d) { return d[metric]; });
		
		// minimum x
		if(me.currentMinX == null) {
			me.currentMinX = xMin;
		} else {
			if(me.currentMinX > xMin) {
				me.currentMinX = xMin;
			}
		}
		
		// maximum x
		if(me.currentMaxX == null) {
			me.currentMaxX = xMax;
		} else {
			if(me.currentMaxX < xMax) {
				me.currentMaxX = xMax;
			}
		}
		
		me.xScale = d3.scale.linear()
			.domain([me.currentMinX, me.currentMaxX])
			.range([me.margins.left, me.canvasWidth - me.margins.right]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.orient('bottom')
			.ticks(me.xTicks)
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.MultiLineChart
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 * @param data Object[]
 	 */
	setYScale: function(metric, data) {
		var me = this;
		
		var yScalePadding = me.yScalePadding,
			yMin = d3.min(data, function(d) { return d[metric]; }),
			yMax = d3.max(data, function(d) { return d[metric]; });
			
		// minimum y
		if(me.currentMinY == null) {
			me.currentMinY = yMin;
		} else {
			if(me.currentMinY > yMin) {
				me.currentMinY = yMin;
			}
		}
		
		// maximum x
		if(me.currentMaxY == null) {
			me.currentMaxY = yMax;
		} else {
			if(me.currentMaxY < yMax) {
				me.currentMaxY = yMax;
			}
		}
		
		me.yScale = d3.scale.linear()
			//.domain([me.currentMinY, me.currentMaxY])
			.domain([0, me.currentMaxY])
			.range([me.canvasHeight - me.margins.bottom, me.margins.top]);
			
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.orient('left')
			.ticks(me.yTicks)
			.tickFormat(me.yTickFormat);	
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
			
		/*me.canvasArea = d3.svg.area()
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y0(me.canvasHeight - me.margins.bottom)
			.y1(function(d) { return yScale(d[yDataMetric]); });*/
	},
	
	generateRandomHexColor: function() {
		var r = Math.floor(Math.random() * 203).toString(16),
			g = Math.floor(Math.random() * 203).toString(16),
			b = Math.floor(Math.random() * 203).toString(16);
			
		if(r.length == 1) { r = '0' + r; }
		if(g.length == 1) { g = '0' + g; }
		if(b.length == 1) { b = '0' + b; }
		
		return [r, g, b].join('');
	},
	
	/**
 	 * @function
 	 * @description Remove all g.series
 	 */
 	clearSeries: function() {
	 	var me = this;
	 	
	 	me.gCanvas.selectAll('g .series').remove();
	 	
	 	me.currentMinX = null,
		me.currentMaxX = null,
		me.currentMinY = null,
		me.currentMaxY = null;
	},
	
	/**
  	 * @function
  	 * @description Handle generation/transition of the chart title
  	 */
 	handleChartTitle: function() {
 		var me = this;
 		
 		if(me.chartTitle == null) {
			me.gTitle.selectAll('text').remove();
			return;
		} else {
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
	
	handleGrid: function() {
		var me = this;
		
		// NO GRID !!
		if(!me.showGrid) {
			me.gGrid.selectAll('.vertGrid')
				.transition()
				.duration(250)
				.attr('y1', me.canvasHeight)
				.remove();
				
			me.gGrid.selectAll('.hozGrid')
				.transition()
				.duration(250)
				.attr('x1', 0)
				.remove();
				
			return;
		}
		
		var xScale = me.xScale,
			xDataMetric = me.xDataMetric,
			yScale = me.yScale,
			yDataMetric = me.yDataMetric;
			
		//////////////////////////////////////////////////
		// VERTICAL JRAT
		//////////////////////////////////////////////////
		var verticalSelection = me.gGrid.selectAll('.vertGrid')
			.data(me.xScale.ticks());
			
		verticalSelection.exit().remove();
		
		verticalSelection.enter()
			.append('svg:line')
			.attr('class', 'vertGrid')
			.style('stroke', '#BBBBBB')
			.style('stroke-width', 1)
			.style('stroke-dasharray', ("7,3"));
			
		verticalSelection.transition()
			.duration(500)
			.attr('x1', function(d) {
				return xScale(d);
			})
			.attr('x2', function(d) {
				return xScale(d);
			})
			.attr('y1', function(d) {
				return me.margins.top;
			})
			.attr('y2', me.canvasHeight - me.margins.bottom);
			
		//////////////////////////////////////////////////
		// HORIZONTAL JRAT
		// we're NOT binding graph data to this...we are 
		// binding the tick array from the Y scale
		//////////////////////////////////////////////////
		var horizontalSelection = me.gGrid.selectAll('.hozGrid')
			.data(me.yScale.ticks());
		
		horizontalSelection.exit().remove();
		
		horizontalSelection.enter()
			.append('svg:line')
			.attr('class', 'hozGrid')
			.style('stroke', '#BBBBBB')
			.style('stroke-width', 1)
			.style('stroke-dasharray', ("7,3"));
			
		horizontalSelection.transition()
			.duration(500)
			.attr('x1', me.margins.left)
			.attr('x2', me.canvasWidth - me.margins.right)
			.attr('y1', function(d, i) {
				return yScale(d);
			})
			.attr('y2', function(d, i) {
				return yScale(d);
			})
			.attr('display', function(d, i) {
				return i == 0 ? 'none' : null;
			});
	},
	
	/**
	 *
 	 * SETTERS
 	 *
 	 */
 	setChartTitle: function(title) {
		var me = this;
		me.chartTitle = title;
	},
	
	setFillColor: function(color) {
		var me = this;
		me.fillColor = color;
	},
	
 	setGraphData: function(data) {
		var me = this;
		me.graphData = data;
	},
	
 	setInterpolation: function(interp) {
		var me = this;
		me.interpolate = interp;
	},
	
	setShowGrid: function(bool) {
		var me = this;
		me.showGrid = bool;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		me.showLabels = bool;
	},
	
	setXDataMetric: function(metric) {
		var me = this;
		me.xDataMetric = metric;
	},
	
	setXScalePadding: function(num) {
		var me = this;
		me.xScalePadding = num;
	},
	
	setXTickFormat: function(fn) {
		var me = this;
		me.xTickFormat = fn;
	},
	
	setYDataMetric: function(metric) {
		var me = this;
		me.yDataMetric = metric;
	},
	
	setYScalePadding: function(num) {
		var me = this;
		me.yScalePadding = num;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		me.yTickFormat = fn;
	}
});