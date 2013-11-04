/**
 * @class
 * @memberOf App.util.d3
 * @description Generic bar chart
 */
Ext.define('App.util.d3.BarChart', {
	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * The "g" element to hold the bars
 	 */
	gBar: null,
	
	/**
 	 * The "g" element to hold the text
 	 */
	gText: null,
	
	/**
 	 * The "g" element to hold the Y axis
 	 */
	gAxis: null,
	
	/**
	 * Overall height of the drawing canvas.  This should be passed
	 * as a configuration item
	 */
	canvasHeight: 400,
	
	/**
	 * Overal width of the drawing canvas. Should be passed as a configuration
	 * item
	 */
	canvasWidth: 400,
	
	/**
 	 * Height offset of bars and axis from the top
 	 */
	heightOffset: 5,
	
	/**
	 * An array of data objects for the graph
	 */
	graphData: [],
	
	/**
 	 * Default metric, i.e. data[defaultMetric] to use when initializing
 	 * the drawing
 	 */
	defaultMetric: null,
	
	/**
 	 * The ExtJS panel ID in which the drawing is rendered
 	 */
	panelId: null,
	
	/**
	 * Show bar graph labels.  TODO: Customize placement of labels
	 */
	showLabels: false,
	labelOffsetTop: 20,	 // height (in pix) to lower graph to show top labels
	labelDistanceFromBar: 10,	// needs to be less than labelOffsetTop
	
	/**
 	 * Default margins for the drawing
 	 */
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 50,
		leftAxis: 40
	},
	
	/**
 	 * spacig between bars
 	 */
	barPadding: 5,
	
	/**
 	 * color scale
 	 */
	colorScale: d3.scale.category20(),
	
	/**
 	 * desired increments
 	 */
 	desiredYIncrements: null,
	
	/**
	 * default increments, ticks
 	 */
 	yTicks: 10,
	
	/**
 	 * Scales and Axes
 	 */
	xScale: null,
	yScale: null,
	yAxisScale: null,
	yAxis: null,
	
	/**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * Default function for rendering a label
 	 */
 	labelFunction: function(data, index) {
	 	return 'label';
	},
	
	/**
 	 * enable the handling of click/mouse events
 	 */
	handleEvents: false,
	
	/**
	 * @private
	 * Default message bus / event relay mechanism
	 */
	eventRelay: false,
	
	/**
 	 * mouse over events configuration object
 	 */
	mouseOverEvents: {
		enabled: false,
		eventName: '',
		eventDataMetric: ''
	},
	
	constructor: function(config) {
		Ext.apply(this, config);
		
		// event handling
		if(this.handleEvents) {
			this.eventRelay = Ext.create('App.util.MessageBus');
		}
		
		// make room on top for labels
		// this must come before the heightOffset assignment
		// below
		if(config.showLabels) {
			this.margins.top += this.labelOffsetTop;
		}
		
		// setting height offset
		this.heightOffset = this.canvasHeight - this.margins.top;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the horizontal scale
 	 */
	setXScale: function() {
		this.xScale = d3.scale.linear()
			.domain([0, this.graphData.length])
			.range([this.margins.left, this.canvasWidth - this.margins.right]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the vertical (y) scale
 	 */
	setYScale: function(metric) {
		this.yScale = d3.scale.linear()
			.domain([0, d3.max(this.graphData, function(d) { return d[metric]; })])
			.range([this.margins.bottom, this.heightOffset]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the scale for the yAxis
 	 */
	setYAxisScale: function(metric) {
		this.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(this.graphData, function(d) { return d[metric]; })])
			.range([this.canvasHeight-this.margins.bottom, this.canvasHeight - this.heightOffset]);
			
		
		var _yTicks = this.yTicks;
		
		// "guess" on increments
		if(this.desiredYIncrements != null) {
			var max = d3.max(this.graphData, function(d) { return d[metric]; });
			
			if(this.desiredYIncrements > 0) {
				_yTicks = parseInt(max/this.desiredYIncrements);
			}
		}
			
		this.yAxis = d3.svg.axis()
			.scale(this.yAxisScale)
			.orient('left')
			.ticks(_yTicks);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		me.gBar = me.svg.append('svg:g');
		me.gText = me.svg.append('svg:g');
		me.gAxis = me.svg.append('svg:g');
		
		// set scales
		me.setXScale();
		me.setYScale(me.defaultMetric);
		me.setYAxisScale(me.defaultMetric);
		
		// bring ExtJS variables
		// into local scope for use in D3
		var xScale = me.xScale,
			yScale = me.yScale,
			yAxis = me.yAxis,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			defaultMetric = me.defaultMetric,
			margins = me.margins,
			graphData = me.graphData,
			barPadding = me.barPadding,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents,
			labelDistanceFromBar = me.labelDistanceFromBar;
			
			
		if(me.graphData.length == 0) {
			me.drawNoData();
			return;
		}
		
		// draw rectangles / bars
		me.gBar.selectAll('rect')
			.data(graphData)
			.enter()
			.append('rect')
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[defaultMetric]);
			})
			.attr('width', function(d) {
				return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
			})
			.attr('height', function(d) {
				return yScale(d[defaultMetric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d) {
				if(handleEvents && eventRelay && mouseOverEvents.enabled) {
					eventRelay.publish(
						mouseOverEvents.eventName,
						{
							value: d[mouseOverEvents.eventDataMetric]
						}
					);
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			});
		
		// construct labels, if applicable
		if(me.showLabels) {
			me.gText.selectAll('text')
				.data(graphData)
				.enter()
				.append('text')
				.attr('class', 'tinyText')
				.attr('x', function(d, i) {
					return xScale(i);
				})
				.attr('y', function(d) {
					return canvasHeight - yScale(d[defaultMetric]) - labelDistanceFromBar;
				})
				.attr('text-anchor', 'start')
				.text(me.labelFunction);
		}
		
		// call the Y-axis			
		me.gAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(yAxis);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @param metric
 	 * @description Transition the bar chart based on a new metric (data record property)
 	 */
	transition: function(metric) {
		var me = this;
		
		// set scales
		me.setXScale();
		me.setYScale(metric);
		me.setYAxisScale(metric);
		
		// y scale local scope
		var yScale = me.yScale,
			canvasHeight = me.canvasHeight,
			margins = me.margins,
			labelDistanceFromBar = me.labelDistanceFromBar;
		
		// transition rectangles
		me.gBar.selectAll('rect')
			.transition()
			.duration(500)
			.attr('y', function(d) {
				return canvasHeight - yScale(d[metric]);
			})
			.attr('height', function(d) {
				return yScale(d[metric]) - margins.bottom;
			});
			
		// transition labels
		if(me.showLabels) {
			me.gText.selectAll('text')
				.transition()
				.duration(500)
				.attr('y', function(d) {
					return canvasHeight - yScale(d[metric]) - labelDistanceFromBar;
				});
		}
			
		// re-call they y axis function
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
	}
});