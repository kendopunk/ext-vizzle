/**
 * @class
 * @memberOf App.util.d3
 * @description Simple bar chart with legend and flex configuration
 */
Ext.define('App.util.d3.BarLegendChart', {
	/**
 	 * The primary SVG element.  Must be set (after render) outside this class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * The "g" element to hold the bars
 	 */
	gBar: null,
	
	/**
 	 * The "g" element to hold the label text
 	 */
	gLabel: null,
	
	/**
	 * The "g" element to hold the legend
	 */
	gLegend: null,
	
	/**
 	 * The "g" element to hold the Y axis
 	 */
	gAxis: null,
	
	/**
	 * Overall height of the drawing canvas.  This should be passed
	 * as a configuration item
	 */
	canvasWidth: 500,
	
	/**
	 * Overal width of the drawing canvas. Should be passed as a configuration
	 * item
	 */
	canvasHeight: 500,
	
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
	 * Set to true to show labels above bars
	 */
	showLabels: false,
	
	/**
 	 * height (in pix) to lower graph to show top labels
 	 */
	labelOffsetTop: 30,
	
	/**
 	 * needs to be less than labelOffsetTop
 	 */
	labelDistanceFromBar: 20,
	
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
 	 * spacing between bar chart bars
 	 */
	barPadding: 5,
	
	/**
 	 * chart and legend flex default values
 	 */
 	chartFlex: 1,
 	legendFlex: 1,
 	
 	/**
  	 * height and width of legend colored rects
  	 */
  	legendSquareWidth: 10,
  	legendSquareHeight: 10,
  	
  	/**
  	 * hard space between chart and legend
  	 */
	spaceBetweenChartAndLegend: 20,
	
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
 	 * default text function for the legend
 	 */
 	legendTextFunction: function(data, index) {
	 	return 'legend item';
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
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @description Set the horizontal scale
 	 */
	setXScale: function() {
		var me = this,
			chartUnits = me.getFlexUnit() * me.chartFlex;
			
		me.xScale = d3.scale.linear()
			.domain([0, me.graphData.length])
			.range([0, chartUnits]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @description Set the vertical (y) scale
 	 */
	setYScale: function(metric) {
		this.yScale = d3.scale.linear()
			.domain([0, d3.max(this.graphData, function(d) { return d[metric]; })])
			.range([this.margins.bottom, this.heightOffset]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarLegendChart
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
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		// sanity check
		if(me.svg == null || me.defaultMetric == null) {
			Ext.Msg.alert('Configuration Error', 'Missing required configuration data needed<br>to render visualization.');
			return;
		}
		
		// set scales
		me.setXScale();
		me.setYScale(me.defaultMetric);
		me.setYAxisScale(me.defaultMetric);
		
		var canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight,
			xScale = me.xScale,
			yScale = me.yScale,
			yAxis = me.yAxis,
			defaultMetric = me.defaultMetric,
			margins = me.margins,
			graphData = me.graphData,
			barPadding = me.barPadding,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents,
			labelDistanceFromBar = me.labelDistanceFromBar,
			spaceBetweenChartAndLegend = me.spaceBetweenChartAndLegend,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex,
			oneFlexUnit = me.getFlexUnit(),
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight;
		
		/**
 		 * empty data array ??
 		 * draw placeholder visualization and exit
 		 */	
		if(me.graphData.length == 0) {
			me.drawNoData();
			return;
		}

		// the "bar" g
		me.gBar = me.svg.append('svg:g')
			.attr('transform', 'translate(' + margins.left + ', 0)');
			
		// the "legend" g
		// TODO: Set the y translation value as a configuration item
		var legendTranslateX = margins.left + (me.getFlexUnit() * chartFlex) + spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', 20)');
			
		// the "label" g
		me.gLabel = me.svg.append('svg:g')
			.attr('transform', 'translate(' + margins.left + ', 0)');
			
		// the "axis" g
		me.gAxis = me.svg.append('svg:g');
			
		/**
 		 * draw the rectangles
 		 */
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
				return ((oneFlexUnit * chartFlex)/graphData.length) - barPadding;
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
		
		/**
 		 * construct bar labels, if true
 		 */
		if(me.showLabels) {
			me.gLabel.selectAll('text')
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
		
		/**
 		 * call the Y-axis function
 		 */
		me.gAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(yAxis);
			
		// bring "bar" g into local scope
		var bars = me.gBar;
			
		/**
 		 * legend rectangles
 		 */
		me.gLegend.selectAll('rect')
			.data(me.graphData)
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			.style('defaultOpacity', 1)
			.style('opacity', 1)
			.on('mouseover', function(d, i) {
				// fade this rectangle
				d3.select(this).style('opacity', .4);
				
				// outline the bars
				bars.selectAll('rect').filter(function(e, j) {
					return i == j;
				})
				.style('stroke', '#000000')
				.style('stroke-width', 2)
				.style('opacity', 1)
				.attr('transform', 'translate(0, -10)');
			})
			.on('mouseout', function(d, i) {
				// unfade this rect
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
				
				// back to normal
				bars.selectAll('rect').filter(function(e, j) {
					return i == j;
				})
				.style('stroke', 0)
				.style('stroke-width', null)
				.style('opacity', .6)
				.transition()
				.duration(500)
				.attr('transform', 'translate(0,0)');
			});
		
		/**
 		 * legend text elements
 		 */
		me.gLegend.selectAll('text')
			.data(me.graphData)
			.enter()
			.append('text')
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction)
			.on('mouseover', function(d, i) {
				// highlight text
				d3.select(this)
					.style('fill', '#000099')
					.style('font-weight', 'bold');
				
				// outline the bars
				bars.selectAll('rect').filter(function(e, j) {
					return i == j;
				})
				.style('stroke', '#000000')
				.style('stroke-width', 2)
				.style('opacity', 1)
				.attr('transform', 'translate(0, -10)');
				
			})
			.on('mouseout', function(d, i) {
				// un-highlight text
				var el = d3.select(this);
				el.style('fill', '#000000')
					.style('font-weight', 'normal');
					
				// back to normal
				bars.selectAll('rect').filter(function(e, j) {
					return i == j;
				})
				.style('stroke', 0)
				.style('stroke-width', null)
				.style('opacity', .6)
				.transition()
				.duration(500)
				.attr('transform', 'translate(0,0)');
			});
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @param metric
 	 * @description Takes a numeric index from the data record as the y scale
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
			labelDistanceFromBar = me.labelDistanceFromBar,
			gLegend = me.gLegend;
		
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
			me.gLabel.selectAll('text')
				.transition()
				.duration(500)
				.attr('y', function(d) {
					return canvasHeight - yScale(d[metric]) - labelDistanceFromBar;
				});
		}
			
		// re-call they y axis function
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
		
		// set the new legend text
		gLegend.selectAll('text')
		 	.text(me.legendTextFunction);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @description Return the width of a flex "unit"
 	 */
	getFlexUnit: function() {
		var me = this,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			spaceBetweenChartAndLegend = me.spaceBetweenChartAndLegend,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex;
		
		var workingWidth = canvasWidth - margins.left - margins.right - spaceBetweenChartAndLegend;
		
		return Math.floor(workingWidth/(chartFlex + legendFlex));
	}
});