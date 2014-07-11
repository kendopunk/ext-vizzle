/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly customizable, responsive scatterplot
 */
Ext.define('App.util.d3.UniversalScatter', {
	
	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	canvasWidth: 400,
	canvasHeight: 400,
	chartTitle: null,
	colorScale: d3.scale.category20(),
	eventRelay: null,
	
	// "g" elements
	gScatter: null,
	gLabel: null,
	gGrid: null,
	gXAxis: null,
 	gYAxis: null,
 	gTitle: null,
 	
 	
 	graphData: [],
 	handleEvents: false,
 	labelFunction: function(data, index) {
	 	return 'label';
	},
 	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 90
	},
 	panelId: null,
 	labelClass: 'labelText',
 	mouseEvents: {
	 	mouseover: {
		 	enabled: false,
		 	eventName: null
		},
		click: {
			enabled: false,
			eventName: null
		},
		dblclick: {
			enabled: false,
			eventName: null
		}
	},
 	radius: 3,
 	scaleToZero: true, 	
 	showGrid: true,
 	showLabels: true,
 	tooltipFunction: function(data, index) {
	 	return 'tooltip';
	},
 	
	xDataMetric: null,
	xScale: null,
	xScalePadding: .1,
	xTicks: 10,
	xTickFormat: function(d) {
		return Ext.util.Format.number(d, '0,000');
	},
	
 	yDataMetric: null,
 	yScale: null,
 	yScalePadding: .1,
 	yTicks: 10,
 	yTickFormat: function(d) {
	 	return Ext.util.Format.number(d, '0,000');
	},
	
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
	},
	
	/**
	 * @function
	 * @description Initialize charting components
	 */
	initChart: function() {
		var me = this;
		
		var xAxTrans = me.canvasHeight - me.margins.bottom;
		
		////////////////////////////////////////
		// "g" elements
		////////////////////////////////////////
		me.gScatter = me.svg.append('svg:g');
		
		me.gGrid = me.svg.append('svg:g');
		
		me.gLabel = me.svg.append('svg:g');
		
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
		
		return me;
	},
	
	/**
 	 * @function
 	 * @description Draw/redraw
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.svg == null || me.xDataMetric == null || me.yDataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
			
		//////////////////////////////////////////////////
		// HANDLERS
		//////////////////////////////////////////////////
		me.handleCircles();
		me.handleLabels();
		me.handleChartTitle();
		me.handleGrid();
		me.callAxes();
	},
	
	/**
 	 * @function
 	 * @description Handle the drawing/regeneration of circles
 	 */
 	handleCircles: function() {
	 	var me = this;
	 	
	 	// local scope
	 	var xScale = me.xScale,
	 		xDataMetric = me.xDataMetric,
		 	yScale = me.yScale,
		 	yDataMetric = me.yDataMetric;
		 	
		////////////////////////////////////////
		// CIRCLES - JRAT
		////////////////////////////////////////
	 	
	 	// join new to old
	 	var circSelection = me.gScatter.selectAll('circle')
	 		.data(me.graphData);
	 		
	 	// transition out old
	 	circSelection.exit()
		 	.transition()
		 	.duration(500)
		 	.attr('r', 0)
		 	.remove();
		 	
		// add new
		circSelection.enter()
			.append('circle')
			.attr('defaultOpacity', .6)
			.style('fill', me.colorScaleFunction)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1);
			
		// apply events
		circSelection.on('mouseover', function(d, i) {
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			})
			.call(d3.helper.tooltip().text(me.tooltipFunction));
			
		// transition all
		circSelection.transition()
			.duration(500)
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			})
			.attr('r', me.radius);
	},
	
	/**
	 * @function
	 * @description Handle labels
	 */
	handleLabels: function() {
		var me = this;
		
		// local scope
		var xScale = me.xScale,
			xDataMetric = me.xDataMetric,
			yScale = me.yScale,
			yDataMetric = me.yDataMetric,
			radius = me.radius;
		
		// join new with old
		var labelSelection = me.gLabel.selectAll('text')
			.data(me.graphData);
			
		// remove
		labelSelection.exit().remove();
			
		// new labels
		labelSelection.enter()
			.append('text')
			.style('font-size', me.labelFontSize)
			.attr('text-anchor', 'start');
				
		// transition all
		labelSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('y', function(d) {
				return yScale(d[yDataMetric]) + ((radius * 2) + 2);
			})
			.text(me.labelFunction);
	},
	
	/**
	 * @function
	 * @description Handle marker lines / guidelines
	 */
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
			.data(me.graphData);
			
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
				return xScale(d[xDataMetric]);
			})
			.attr('x2', function(d) {
				return xScale(d[xDataMetric]);
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
	 * @function
	 * @description Handle the chart title drawing / transitioning
	 */
	handleChartTitle: function() {
		var me = this;
		
		var ct = me.chartTitle == null ? '' : me.chartTitle;
		
		me.gTitle.selectAll('text').remove();
	
		me.gTitle.selectAll('text')
			.data([ct])
			.enter()
			.append('text')
			.style('fill', '#444444')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d;
			});
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalScatter
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 */
	setXScale: function(metric) {
		var me = this;
		
		var xScalePadding = me.xScalePadding,
			domainMin = 0;

			var max = d3.max(me.graphData, function(d) { return d[metric]; });
			var domainMax = max + (max * me.xScalePadding);
			
		if(!me.scaleToZero) {
			var min = d3.min(me.graphData, function(d) {return d[metric]; });
			domainMin = min - (min * me.xScalePadding);
		}
		
		me.xScale = d3.scale.linear()
			.domain([domainMin, domainMax])
			.range([
				me.margins.left,
				me.canvasWidth - me.margins.right
			]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.orient('bottom')
			.ticks(10)
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalScatter
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 */
	setYScale: function(metric) {
		var me = this;
		
		var yScalePadding = me.yScalePadding,
			domainMin = 0;
			
		if(!me.scaleToZero) {
			var domainMin = d3.min(me.graphData, function(d) {
				return d[metric] - yScalePadding;
			});
		}
		
		me.yScale = d3.scale.linear()
			.domain([
				domainMin,
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
	 * @function
	 */
	callAxes: function() {
		var me = this;
		
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
	},
	
	/**
	 *
 	 * SETTERS
 	 *
 	 */
 	setColorScaleFunction: function(fn) {
	 	var me = this;
	 	
	 	me.colorScaleFunction = fn;
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
	
	setShowLabels: function(bool) {
		var me = this;
		
		me.showLabels = bool;
	},
	
	setScaleToZero: function(bool) {
		var me = this;
		
		me.scaleToZero = bool;
	},
	
	setXScalePadding: function(num) {
		var me = this;
		
		me.xScalePadding = num;
	},
	
	setYScalePadding: function(num) {
		var me = this;
		
		me.yScalePadding = num;
	},
	
	setshowGrid: function(bool) {
		var me = this;
		
		me.showGrid = bool;
	}
});