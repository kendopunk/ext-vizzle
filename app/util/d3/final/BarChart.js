/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Highly configurable bar chart
 */
Ext.define('App.util.d3.final.BarChart', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	/**
	 * other configs
	 */
	barPadding: 5,		// spacing between bars
	canvasHeight: 400,
	canvasWidth: 400,
	chartFlex: 3,
	chartTitle: null,
	colorScale: d3.scale.category20(),
	dataMetric: null,	// default metric, i.e. data[dataMetric] to use when
						// initializing the drawing
	desiredYIncrements: null,
	eventRelay: null,
	gBar: null,		// "g" element to hold the bars
	gLegend: null,	// "g" element to hold the right-side legend
	gText: null,	// "g" element to hold the text
	gTitle: null,	// "g" element to hold the title
	gXAxis: null,	// "g" element to hold the X axis
	gYAxis: null,	// "g" element to hold the Y axis
	graphData: [],	// array of objects for the graph
	handleEvents: false,
	heightOffset: 5,	// offset of bars from top
	labelDistanceFromBar: 10,	// needs to be less than labelOffsetTop
	labelFontSize: '9px',
	labelFunction: function(data, index) {
		return 'label';
	},
	labelOffsetTop: 15,	// height (in pix) to lower graph to show top labels
	legendFlex: 1,
	legendSquareWidth: 10,
  	legendSquareHeight: 10,
  	legendFontSize: '9px',
  	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 50,
		leftAxis: 40
	},
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
	orientation: 'vertical',	// vertical | horizontal
	panelId: null,
	showChartTitle: false,
	showLabels: false,
	showLegend: false,
	spaceBetweenChartAndLegend: 20,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	xScale: null,
	yAxis: null,
	yAxisScale: null,
	yScale: null,
	yTicks: 10,
 	yTickFormat: function(d) {
	 	return d;
	},
	
	/**
 	 * init
 	 */
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
 	 * @override
 	 * @memberOf App.util.d3.final.BarChart
 	 * @description Set the horizontal scale, depending on legend on/off
 	 */
	setXScale: function() {
		var me = this;
		
		if(me.showLegend) {
			var chartUnits = me.getFlexUnit() * me.chartFlex;
			
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([0, chartUnits]);
		} else {
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, me.canvasWidth - me.margins.right]);
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.BarChart
 	 * @description Set the vertical (y) scale
 	 */
	setYScale: function(metric) {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[metric]; })])
			.range([me.margins.bottom, me.heightOffset]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.BarChart
 	 * @description Set the scale for the yAxis
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[metric]; })])
			.range([me.canvasHeight-me.margins.bottom, me.canvasHeight - me.heightOffset]);
			
		
		var _yTicks = me.yTicks;
		
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
 	 * @memberOf App.util.d3.final.BarChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.svg == null || me.dataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.');
			return;
		}
		
		//////////////////////////////////////////////////
		// configure the rectangle "g" element
		// text "g" element, and
		// Y axis "g" element
		//////////////////////////////////////////////////
		me.gBar = me.svg.append('svg:g');
		if(me.showLegend) {
			me.gBar.attr('transform', 'translate(' + me.margins.left + ', 0)');
		}
		me.gText = me.svg.append('svg:g');
		if(me.showLegend) {
			me.gText.attr('transform', 'translate(' + me.margins.left + ', 0)');
		}
		me.gYAxis = me.svg.append('svg:g');
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(me.dataMetric);
		me.setYAxisScale(me.dataMetric);
		
		//////////////////////////////////////////////////
		// bring class vars into local scope
		//////////////////////////////////////////////////
		var barPadding = me.barPadding,
			eventRelay = me.eventRelay,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			chartFlex = me.chartFlex,
			chartTitle = me.chartTitle,
			colorScale = me.colorScale,
			dataMetric = me.dataMetric,
			graphData = me.graphData,
			handleEvents = me.handleEvents,
			labelDistanceFromBar = me.labelDistanceFromBar,
			legendFlex = me.legendFlex,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth,
			margins = me.margins,
			mouseEvents = me.mouseEvents,
			oneFlexUnit = me.getFlexUnit(),
			showLegend = me.showLegend,
			spaceBetweenChartAndLegend = me.spaceBetweenChartAndLegend,
			xScale = me.xScale,
			yAxis = me.yAxis,
			yScale = me.yScale;
		
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
				if(showLegend) {
					return ((oneFlexUnit * chartFlex)/graphData.length) - barPadding;
				} else {
					return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
				}
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
		// call the Y axis function
		//////////////////////////////////////////////////
		me.gYAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(yAxis);
		
		//////////////////////////////////////////////////
		// handle the legend, if applicable
		//////////////////////////////////////////////////
		var legendTranslateX = margins.left 
			+ (me.getFlexUnit() * chartFlex) 
			+ spaceBetweenChartAndLegend;
				
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
			
		if(showLegend) {	
			// bring bars into local scope
			var bars = me.gBar;
			
			// legend squares
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
			
			// legend text elements
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
				.style('font-size', me.legendFontSize)
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
					.attr('transform', 'translate(0,' + (me.labelDistanceFromBar-3) * -1 + ')'); 
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
		}
			
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
 	 * @memberOf App.util.d3.final.BarChart
 	 * @description Transition the bar chart
 	 */
	transition: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(me.dataMetric);
		me.setYAxisScale(me.dataMetric);
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var barPadding = me.barPadding,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			chartFlex = me.chartFlex,
			colorScale = me.colorScale,
			dataMetric = me.dataMetric,
			eventRelay = me.eventRelay,
			graphData = me.graphData,
			handleEvents = me.handleEvents,
			labelDistanceFromBar = me.labelDistanceFromBar,
			legendFlex = me.legendFlex,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			margins = me.margins,
			mouseEvents = me.mouseEvents;
			oneFlexUnit = me.getFlexUnit(),
			showLegend = me.showLegend,
			xScale = me.xScale,
			yScale = me.yScale;
			
		//////////////////////////////////////////////////
		//
		// rectangle transition
		//
		//////////////////////////////////////////////////
		// join new data with old data
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
			
		// transition out old bars
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		// add new bars
		var newBars = rectSelection.enter()
			.append('rect')
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1);
			
		// apply events
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
		
		// transition rectangles
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[dataMetric]);
			})
			.attr('width', function(d) {
				if(showLegend) {
					return ((oneFlexUnit * chartFlex)/graphData.length) - barPadding;
				} else {
					return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
				}
			})
			.attr('height', function(d) {
				return yScale(d[dataMetric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				return colorScale(i);
			});
		
		//////////////////////////////////////////////////
		//
		// label transition
		//
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
					return canvasHeight - yScale(d[dataMetric]) - labelDistanceFromBar;
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
		//
		// legend transition
		//
		//////////////////////////////////////////////////
		if(showLegend) {
			// bring the bar "g" into local scope
			var bars = me.gBar;
			
			//
			// SQUARES
			//
			
			// join new squares with current squares
			var legendSquareSelection = me.gLegend.selectAll('rect')
				.data(me.graphData);
				
			// remove old squares
			legendSquareSelection.exit().remove();
			
			// add new squares
			legendSquareSelection.enter().append('rect')
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
			
			// transition all squares
			legendSquareSelection.transition()
				.attr('x', 0)
				.attr('y', function(d, i) {
					return i * legendSquareHeight * 1.75;
				})
				.attr('width', me.legendSquareWidth)
				.attr('height', me.legendSquareHeight)
				.attr('fill', function(d, i) {
					return colorScale(i);
				});
				
			//
			// TEXT
			//
			
			// join new text with current text
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(me.graphData);
				
			// remove old text
			legendTextSelection.exit().remove();
			
			// add new text
			legendTextSelection.enter().append('text')
				.style('font-size', me.legendFontSize)
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
					.attr('transform', 'translate(0,' + (me.labelDistanceFromBar-3) * -1 + ')'); 
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
				
			// transition all text
			legendTextSelection.transition()
				.attr('x', legendSquareWidth * 2)
				.attr('y', function(d, i) {
					return i * legendSquareHeight * 1.75;
				})
				.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
				.text(me.legendTextFunction);
		}
		
		//////////////////////////////////////////////////
		//
		// title transition
		//
		//////////////////////////////////////////////////
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.text(me.chartTitle);
		}
		
		//////////////////////////////////////////////////
		//
		// re-call the Y axis function
		//
		//////////////////////////////////////////////////
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
	},
	
	/**
	 * 
	 * getters
	 *
	 */
	getFlexUnit: function() {
		// calculate the width of a flex "unit"
		var me = this;
			
		var workingWidth = me.canvasWidth
			- me.margins.left
			- me.margins.right
			- me.spaceBetweenChartAndLegend;
			
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	},
	
	/**
	 * 
 	 * setters
 	 *
 	 */
 	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	setDataMetric: function(metric) {
	 	var me = this;
	 	
	 	me.dataMetric = metric;
	},
	
	setDesiredYIncrements: function(increments) {
	 	var me = this;
	 	
	 	me.desiredYIncrements = increments;
	},
	
	setGraphData: function(data) {
	 	var me = this;
	 	
	 	me.graphData = data;
	},
	
	setLegendTextFunction: function(fn) {
		var me = this;
		
		me.legendTextFunction = fn;
	},
	
	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		
		me.yTickFormat = fn;
	}
});