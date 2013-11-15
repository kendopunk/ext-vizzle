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
 	 * The "g" element to hold the title
 	 */
 	gTitle: null,
	
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
 	 * Default metric, i.e. data[dataMetric] to use when initializing
 	 * the drawing
 	 */
	dataMetric: null,
	
	/**
 	 * The ExtJS panel ID in which the drawing is rendered
 	 */
	panelId: null,
	
	/**
	 * Show bar graph labels.  TODO: Customize placement of labels
	 */
	showLabels: false,
	labelFontSize: 9,
	labelOffsetTop: 15,	 // height (in pix) to lower graph to show top labels
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
 	 * desired increments for Y axis
 	 */
 	desiredYIncrements: null,
	
	/**
	 * default y tick increments and default
	 *   tick formatting function
 	 */
 	yTicks: 10,
 	yTickFormat: function(d) {
	 	return d;
	},
	
	/**
 	 * Scales and Axes
 	 */
	xScale: null,
	yScale: null,
	yAxisScale: null,
	yAxis: null,
	
	/**
 	 * chart title configs
 	 */
 	chartTitle: null,
 	showChartTitle: false,
	
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
 	 * mouse events
 	 */
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
	
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
		
		// make room on top for labels
		// this must come before the heightOffset assignment
		// below
		if(config.showLabels) {
			me.margins.top += me.labelOffsetTop;
		}
		
		// setting the height offset
		me.heightOffset = me.canvasHeight - me.margins.top - me.labelOffsetTop;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the horizontal scale
 	 */
	setXScale: function() {
		var me = this;
		
		me.xScale = d3.scale.linear()
			.domain([0, me.graphData.length])
			.range([me.margins.left, me.canvasWidth - me.margins.right]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the vertical (y) scale
 	 */
	setYScale: function(metric) {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[metric]; })])
			.range([me.margins.bottom, this.heightOffset]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the scale for the yAxis
 	 */
	setYAxisScale: function(metric) {
		
		var me = this;
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[metric]; })])
			.range([me.canvasHeight-this.margins.bottom, me.canvasHeight - this.heightOffset]);
			
		
		var _yTicks = this.yTicks;
		
		// "guess" on increments
		if(me.desiredYIncrements != null) {
			var max = d3.max(me.graphData, function(d) { return d[metric]; });
			
			if(me.desiredYIncrements > 0) {
				_yTicks = parseInt(max/me.desiredYIncrements);
			}
		}
			
		me.yAxis = d3.svg.axis()
			.scale(me.yAxisScale)
			.orient('left')
			.ticks(_yTicks)
			.tickFormat(me.yTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.svg == null || me.dataMetric == null) {
			Ext.Msg.alert('Configuration Error', 'Missing required configuration data needed<br>to render visualization.');
			return;
		}
		
		//////////////////////////////////////////////////
		// set "g" elements
		//////////////////////////////////////////////////
		me.gBar = me.svg.append('svg:g');
		me.gText = me.svg.append('svg:g');
		me.gAxis = me.svg.append('svg:g');
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(me.dataMetric);
		me.setYAxisScale(me.dataMetric);
		
		//////////////////////////////////////////////////
		// bring ExtJS variables
		// into local scope for use in D3
		//////////////////////////////////////////////////
		var xScale = me.xScale,
			yScale = me.yScale,
			yAxis = me.yAxis,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			dataMetric = me.dataMetric,
			margins = me.margins,
			graphData = me.graphData,
			barPadding = me.barPadding,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			labelDistanceFromBar = me.labelDistanceFromBar;
			
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			return;
		}
		
		//////////////////////////////////////////////////
		// draw rectangle / bars
		//////////////////////////////////////////////////
		me.gBar.selectAll('rect')
			.data(graphData)
			.enter()
			.append('rect')
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[dataMetric]);
			})
			.attr('width', function(d) {
				return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
			})
			.attr('height', function(d) {
				return yScale(d[dataMetric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d, i) {
				
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			});
		
		//////////////////////////////////////////////////
		// construct labels, if applicable
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.gText.selectAll('text')
				.data(graphData)
				.enter()
				.append('text')
				.attr('class', 'tinyText')
				.style('font-size', me.labelFontSize)
				.attr('x', function(d, i) {
					return xScale(i);
				})
				.attr('y', function(d) {
					return canvasHeight - yScale(d[dataMetric]) - labelDistanceFromBar;
				})
				.attr('text-anchor', 'start')
				.text(me.labelFunction);
		}
		
		//////////////////////////////////////////////////
		// call the Y-axis
		//////////////////////////////////////////////////	
		me.gAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(yAxis);
			
		//////////////////////////////////////////////////
		// chart title
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(function(d) {
					return d;
				});
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Transition the bar chart
 	 */
	transition: function() {
		var me = this;
		
		var metric = me.dataMetric;
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(metric);
		me.setYAxisScale(metric);
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var yScale = me.yScale,
			xScale = me.xScale,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			barPadding = me.barPadding,
			labelDistanceFromBar = me.labelDistanceFromBar,
			colorScale = me.colorScale,
			graphData = me.graphData,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents;
			
		//////////////////////////////////////////////////
		// bars: join new data with old data
		//////////////////////////////////////////////////
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
		
		//////////////////////////////////////////////////
		// transition out old bars
		//////////////////////////////////////////////////
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		//////////////////////////////////////////////////
		// add new bars
		//////////////////////////////////////////////////
		var newBars = rectSelection.enter()
			.append('rect')
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1);
		
		//////////////////////////////////////////////////
		// apply the events
		//////////////////////////////////////////////////
		rectSelection.on('mouseover', function(d, i) {
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			})
			.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		//////////////////////////////////////////////////
		// transition rectangles
		//////////////////////////////////////////////////
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[metric]);
			})
			.attr('width', function(d) {
				return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
			})
			.attr('height', function(d) {
				return yScale(d[metric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			
		//////////////////////////////////////////////////
		// transition labels
		//////////////////////////////////////////////////
		if(me.showLabels) {
			// join
			var labelSelection = me.gText.selectAll('text')
				.data(me.graphData);

			// remove
			labelSelection.exit().remove();
			
			// new labels
			var newLabels = labelSelection.enter()
				.append('text')
				.style('font-size', me.labelFontSize)
				.attr('textAnchor', 'start');
				
			// transition all
			labelSelection.transition()
				.duration(250)
				.attr('x', function(d, i) {
					return xScale(i);
				})
				.attr('y', function(d) {
					return canvasHeight - yScale(d[metric]) - labelDistanceFromBar;
				})
				.text(me.labelFunction);	
		} else {
			me.gText.selectAll('text')
				.transition()
				.duration(250)
				.attr('x', -100)
				.remove();
		}
		
		//////////////////////////////////////////////////
		// TITLE
		//////////////////////////////////////////////////
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.text(me.chartTitle);
		}
		
		//////////////////////////////////////////////////
		// re-call they y axis function
		//////////////////////////////////////////////////
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the dataMetric value (target property name
 	 * of data set)
 	 */
 	setDataMetric: function(metric) {
	 	var me = this;
	 	
	 	me.dataMetric = metric;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the desired Y increments
 	 */
 	setDesiredYIncrements: function(increments) {
	 	var me = this;
	 	
	 	me.desiredYIncrements = increments;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @param fn Function object
 	 * @description Set the Y tick formatting function
 	 */
	setYTickFormat: function(fn) {
		var me = this;
		
		me.yTickFormat = fn;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set new chart data
 	 * @param data Obj
 	 */
 	setGraphData: function(data) {
	 	var me = this;
	 	
	 	me.graphData = data;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @param title String
 	 * @description Set the chart title
 	 */
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Show/hide labels
 	 */
 	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	}
});