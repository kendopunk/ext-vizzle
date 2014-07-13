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
	defs: null,
	eventRelay: null,
	filter: null,
	
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
 	showGrid: true,
 	showLabels: true,
 	tooltipFunction: function(data, index) {
	 	return 'tooltip';
	},
 	
	xDataMetric: null,
	xScale: null,
	xScalePadding: 0,
	xTicks: 10,
	xTickFormat: function(d) {
		return Ext.util.Format.number(d, '0,000');
	},
	
 	yDataMetric: null,
 	yScale: null,
 	yScalePadding: 0,
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
			
		//////////////////////////////////////////////////
		// defs
		//////////////////////////////////////////////////
		me.defs = me.svg.append('defs');
		
		me.filter = me.defs.append('filter')
			.attr('id', 'def_' + me.panelId)
			.attr('x', '-40%')
			.attr('y', '-40%')
			.attr('height', '200%')
			.attr('width', '200%');
		
		// append Gaussian blur to filter
		me.filter.append('feGaussianBlur')
			.attr('in', 'SourceAlpha')
			.attr('stdDeviation', 3) // !!! important parameter - blur
			.attr('result', 'blur');
			
		// append offset filter to result of Gaussian blur filter
		me.filter.append('feOffset')
			.attr('in', 'blur')
			.attr('dx', 2) // !!! important parameter - x-offset
			.attr('dy', 2) // !!! important parameter - y-offset
			.attr('result', 'offsetBlur');
			
		// merge result with original image
		var feMerge = me.filter.append('feMerge');
		
		// first layer result of blur and offset
		feMerge.append('feMergeNode')
			.attr('in", "offsetBlur');
			
		// original image on top
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');
		
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
		 	yDataMetric = me.yDataMetric,
		 	radius = me.radius;
		 	
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
			.style('stroke-width', 1)
			.attr('filter', 'url(#def_' + me.panelId + ')')
			.on('mouseover', function(d, i) {
				d3.select(this).style('opacity', .9)
					.transition()
					.duration(0)
					.attr('r', function() {
						return radius + (radius * .5);
					});
			})
			.on('mouseout', function(d, i) {
				d3.select(this).style('opacity', .6)
					.transition()
					.duration(0)
					.attr('r', function() {
						return radius;
					})
					.ease('bounce');
			});
			
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
		
		// tooltips
		circSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	/**
	 * @function
	 * @description Handle labels
	 */
	handleLabels: function() {
		var me = this;
		
		if(!me.showLabels) {
			me.gLabel.selectAll('text')
				.transition()
				.duration(500)
				.attr('x', -100)
				.remove();
			
			return;
		}
		
		// local scope
		var xScale = me.xScale,
			xDataMetric = me.xDataMetric,
			yScale = me.yScale,
			yDataMetric = me.yDataMetric,
			radius = me.radius;
			
		////////////////////////////////////////
		// LABEL JRAT
		////////////////////////////////////////
		var labelSelection = me.gLabel.selectAll('text')
			.data(me.graphData);
			
		labelSelection.exit().remove();
			
		labelSelection.enter()
			.append('text')
			.attr('class', 'labelText')
			.attr('text-anchor', 'middle');
				
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
			
		// we're NOT binding graph data to the horizontal and vertical lines, we're
		// binding the tick arrays from the X and Y scales
			
		//////////////////////////////////////////////////
		// VERTICAL JRAT
		//////////////////////////////////////////////////
		var verticalSelection = me.gGrid.selectAll('.vertGrid')
			.data(me.xScale.ticks());
			
		console.debug(me.xScale.ticks());
			
		verticalSelection.exit().remove();
		
		verticalSelection.enter()
			.append('svg:line')
			.attr('class', 'vertGrid')
			.style('stroke', '#AAAAAA')
			.style('stroke-width', 0.5)
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
		//////////////////////////////////////////////////
		var horizontalSelection = me.gGrid.selectAll('.hozGrid')
			.data(me.yScale.ticks());
		
		horizontalSelection.exit().remove();
		
		horizontalSelection.enter()
			.append('svg:line')
			.attr('class', 'hozGrid')
			.style('stroke', '#AAAAAA')
			.style('stroke-width', 0.5)
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
		var me = this,
			min,
			domainMin,
			max,
			domainMax;
	
		var xScalePadding = me.xScalePadding;
		
		// min/max
		if(xScalePadding > 0) {
			min = d3.min(me.graphData, function(d) { return d[metric]; });
			domainMin = min - (min * xScalePadding);
			
			max = d3.max(me.graphData, function(d) { return d[metric]; });
			domainMax = max + (max * xScalePadding);
		} else {
			domainMin = 0;
			domainMax = d3.max(me.graphData, function(d) { return d[metric]; });
			domainMax = domainMax + (domainMax * .05);
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
		var me = this,
			min,
			domainMin,
			max,
			domainMax;
	
		var yScalePadding = me.yScalePadding;
		
		// min/max
		if(yScalePadding > 0) {
			min = d3.min(me.graphData, function(d) { return d[metric]; });
			
			// going into negative
			domainMin = min - (min * yScalePadding);
			if(domainMin < 0) {
				domainMin = 0;
			}
			
			max = d3.max(me.graphData, function(d) { return d[metric]; });
			domainMax = max + (max * yScalePadding);
		} else {
			domainMin = 0;
			domainMax = d3.max(me.graphData, function(d) { return d[metric]; });
			domainMax = domainMax + (domainMax * .05);
		}
		
		me.yScale = d3.scale.linear()
			.domain([domainMin, domainMax])
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
	
	setShowGrid: function(bool) {
		var me = this;
		
		me.showGrid = bool;
	}
});