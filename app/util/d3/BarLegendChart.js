/**
 * @class
 * @memberOf App.util.d3
 * @description Extended bar chart with legend and flex values
 */
Ext.define('App.util.d3.BarLegendChart', {
	extend: 'App.util.d3.BarChart',
	
	/**
	 * The "g" element to hold the legend
	 */
	gLegend: null,
	
	/**
 	 * chart and legend flex default values
 	 */
 	chartFlex: 3,
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
 	 * default text function for the legend
 	 */
 	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
	
	constructor: function(config) {
		var me = this;
		
		me.superclass.constructor.call(me, config)
	},
	
	/**
 	 * @function
 	 * @override
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
 	 * @override
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.svg == null || me.defaultMetric == null) {
			Ext.Msg.alert('Configuration Error', 'Missing required configuration data needed<br>to render visualization.');
			return;
		}
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(me.defaultMetric);
		me.setYAxisScale(me.defaultMetric);
		
		//////////////////////////////////////////////////
		// bring class vars into local scope
		//////////////////////////////////////////////////
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

		//////////////////////////////////////////////////
		// configure the rectangle "g" element
		//////////////////////////////////////////////////
		me.gBar = me.svg.append('svg:g')
			.attr('transform', 'translate(' + margins.left + ', 0)');
			
		//////////////////////////////////////////////////
		// configure the label "g" for the rectangles
		//////////////////////////////////////////////////
		me.gText = me.svg.append('svg:g')
			.attr('transform', 'translate(' + margins.left + ', 0)');

		//////////////////////////////////////////////////
		// the legend "g"
		//////////////////////////////////////////////////
		var legendTranslateX = margins.left + (me.getFlexUnit() * chartFlex) + spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
		
		//////////////////////////////////////////////////
		// the label "g" element
		//////////////////////////////////////////////////
		me.gLabel = me.svg.append('svg:g')
			.attr('transform', 'translate(' + margins.left + ', 0)');
		
		//////////////////////////////////////////////////
		// the axis "g" element
		//////////////////////////////////////////////////
		me.gAxis = me.svg.append('svg:g');
			
		//////////////////////////////////////////////////
		// draw the rectangles
		//////////////////////////////////////////////////
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
		
		//////////////////////////////////////////////////
		// constuct rectangle labels, if applicable
		//////////////////////////////////////////////////
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
		
		//////////////////////////////////////////////////
		// call the Y axis function
		//////////////////////////////////////////////////
		me.gAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(yAxis);
		
		//////////////////////////////////////////////////
		// bring the bar "g" into local scope
		//////////////////////////////////////////////////
		var bars = me.gBar;
			
		//////////////////////////////////////////////////
		// legend squares
		//////////////////////////////////////////////////
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
		
		//////////////////////////////////////////////////
		// legend text elements
		//////////////////////////////////////////////////
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
			.style('font-size', '10')
			.on('mouseover', function(d, i) {
				// highlight text
				d3.select(this)
					.style('fill', '#CC3300')
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
		
		//////////////////////////////////////////////////
		// TITLE
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#333333')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(function(d) {
					return d;
				});
		}
	},
	
	/**
 	 * @function
 	 * @override
 	 * @memberOf App.util.d3.BarLegendChart
 	 * @param metric
 	 * @description Transition the chart and legend
 	 */
	transition: function(metric) {
		var me = this;
		
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
			canvasHeight = me.canvasHeight,
			margins = me.margins,
			labelDistanceFromBar = me.labelDistanceFromBar;
		
		//////////////////////////////////////////////////
		// transition rectangles
		//////////////////////////////////////////////////
		me.gBar.selectAll('rect')
			.transition()
			.duration(500)
			.attr('y', function(d) {
				return canvasHeight - yScale(d[metric]);
			})
			.attr('height', function(d) {
				return yScale(d[metric]) - margins.bottom;
			});
		
		//////////////////////////////////////////////////
		// transition labels
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.gText.selectAll('text')
				.transition()
				.duration(500)
				.attr('y', function(d) {
					return canvasHeight - yScale(d[metric]) - labelDistanceFromBar;
				});
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