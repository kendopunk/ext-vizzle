/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly configurable responsive bar chart
 */
Ext.define('App.util.d3.UniversalBar', {
	
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
	chartInitialized: false,
	chartFlex: 3,
	chartTitle: null,
	colorPalette: 'default',
	colorScale: null,
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
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
	spaceBetweenChartAndLegend: 20,
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 50,
		leftAxis: 40
	},
	maxBarWidth: 100,
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
	sortType: null,		// null, _metric_, or an element property
	sortProperty: null,
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
		
		//Ext.apply(me, config);
		Ext.merge(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
		
		// make room on top for labels
		// this must come before the heightOffset assignmentbelow
		me.margins.top += me.labelOffsetTop;
		
		// setting the height offset
		me.heightOffset = me.canvasHeight - me.margins.top - me.labelOffsetTop;
	},
	
	/**
 	 * @function
 	 */
	initChart: function() {
		var me = this;
		
		////////////////////////////////////////
		// "g" elements
		////////////////////////////////////////
		
		// bar
		me.gBar = me.svg.append('svg:g');
		
		// label
		me.gText = me.svg.append('svg:g');
		
		// y axis
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
		
		// title
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
		
		// legend
		var legendTranslateX = me.margins.left 
			+ (me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
		
		// bool
		me.chartInitialized = true;

		return me;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalBar
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		if(!me.chartInitialized) {
			return;
		}
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(me.dataMetric);
		me.setYAxisScale(me.dataMetric);
		me.setColorScale();
		
		//////////////////////////////////////////////////
		// default sorting
		//////////////////////////////////////////////////
		me.checkSort();
		
		//////////////////////////////////////////////////
		// handlers
		//////////////////////////////////////////////////
		me.handleBars();
		me.handleLabels();
		me.handleLegend();
		me.handleChartTitle();
		
		//////////////////////////////////////////////////
		// axis
		//////////////////////////////////////////////////
		//me.gYAxis.call(me.yAxis);
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
	},
	
	/**
 	 * @function
 	 * @description Handle the bars/rects for the bar chart
 	 */
 	handleBars: function() {
	 	var me = this;
	 	
	 	// local scope
		var handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			eventRelay = me.eventRelay,
			xScale = me.xScale,
			canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight,
			yScale = me.yScale,
			dataMetric = me.dataMetric,
			showLegend = me.showLegend,
			graphData = me.graphData,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex,
			oneFlexUnit = me.getFlexUnit(),
			barPadding = me.barPadding,
			margins = me.margins,
			colorScale = me.colorScale,
			colorDefinedInData = me.colorDefinedInData,
			colorDefinedInDataIndex = me.colorDefinedInDataIndex,
			gLegend = me.gLegend;
	 	
	 	// join new with old
	 	var rectSelection = me.gBar.selectAll('rect')
	 		.data(me.graphData);
	 		
	 	// transition out old
 		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		// add new bars
		rectSelection.enter()
			.append('rect')
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1);
			
		// apply events
		rectSelection.on('mouseover', function(d, i) {
			d3.select(this).style('opacity', .9);
			
			if(showLegend) {
				gLegend.selectAll('text').filter(function(e, j) {
					return e[dataMetric] == d[dataMetric];
				})
				.style('fill', '#990066')
				.style('font-weight', 'bold');
			}
			
			me.publishMouseEvent('mouseover', d, i);
		})
		.on('mouseout', function(d, i) {
			var el = d3.select(this);
			el.style('opacity', el.attr('defaultOpacity'));
			
			if(showLegend) {
				gLegend.selectAll('text').filter(function(e, j) {
					return e[dataMetric] == d[dataMetric];
				})
				.style('fill', '#000000')
				.style('font-weight', 'normal');
			}
			
			me.publishMouseEvent('mouseout', d, i);
		})
		.on('dblclick', function(d, i) {
			me.publishMouseEvent('dblclick', d, i);
		})
		.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		// transition all rectangles
		rectSelection.transition()
			.duration(500)
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[dataMetric]);
			})
			.attr('width', function(d) {
				var w;
				
				if(showLegend) {
					w = ((oneFlexUnit * chartFlex)/graphData.length) - barPadding;
				} else {
					w = (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
				}
				
				return Ext.Array.min([w, me.maxBarWidth]);
			})
			.attr('height', function(d) {
				return yScale(d[dataMetric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				if(colorDefinedInData && colorDefinedInDataIndex) {
					return d[colorDefinedInDataIndex];
				} else {
					return colorScale(i);
				}
			});
 	},
 	
 	/**
  	 * @function
  	 * @description Handle drawing/transitioning of labels
  	 */
 	handleLabels: function() {
	 	var me = this;
	 	
	 	if(!me.showLabels) {
	 		me.gText.selectAll('text')
	 			.transition()
	 			.duration(500)
	 			.attr('x', -400)
	 			.remove();
	 			
		 	return;
		}
	 	
	 	// local scope
	 	var labelFontSize = me.labelFontSize,
	 		canvasHeight = me.canvasHeight,
	 		canvasWidth = me.canvasWidth,
	 		xScale = me.xScale,
	 		yScale = me.yScale,
	 		dataMetric = me.dataMetric,
	 		labelDistanceFromBar = me.labelDistanceFromBar,
	 		labelFunction = me.labelFunction;
	 		
	 	// join new with old
		var labelSelection = me.gText.selectAll('text')
			.data(me.graphData);
			
		// remove old
		labelSelection.exit().remove();
		
		// add new labels
		labelSelection.enter()
			.append('text')
			.style('font-size', me.labelFontSize)
			.attr('text-anchor', 'start');
		
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
	},
 	
	/**
	 * @function
	 * @description Handle the bar chart legend
	 */
	handleLegend: function() {
		var me = this;
		
		if(!me.showLegend) {
			me.gLegend.selectAll('rect')
				.transition()
				.duration(500)
				.attr('y', -500)
				.remove();
				
			me.gLegend.selectAll('text')
				.transition()
				.duration(500)
				.attr('x', me.canvasWidth + 200)
				.remove();
				
			return;
		}
		
		// local scope
		var bars = me.gBar,
			colorScale = me.colorScale,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth;
			
		////////////////////////////////////////
		// LEGEND SQUARES
		// join
		// remove
		// add
		// transition
		////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
			.data(me.graphData);
				
		legendSquareSelection.exit().remove();
			
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
				.style('opacity', 1);
				/*.attr('transform', 'translate(0, -10)');*/
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
				.style('opacity', .6);
				/*.transition()
				.duration(500)
				.attr('transform', 'translate(0,0)');*/
			});
		
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
		
		////////////////////////////////////////
		// LEGEND TEXT
		// join
		// remove
		// add
		// transition
		////////////////////////////////////////
		var legendTextSelection = me.gLegend.selectAll('text')
			.data(me.graphData);
				
		legendTextSelection.exit().remove();
			
		legendTextSelection.enter().append('text')
			.style('cursor', 'default')
			.attr('class', 'legendText')
			.on('mouseover', function(d, i) {
				// highlight text
				d3.select(this)
					.style('fill', '#990066')
					.style('font-weight', 'bold');
				
				// outline the bars
				bars.selectAll('rect').filter(function(e, j) {
					return i == j;
				})
				.style('stroke', '#000000')
				.style('stroke-width', 2)
				.style('opacity', 1);
				/*.attr('transform', 'translate(0,' + (me.labelDistanceFromBar-3) * -1 + ')'); */
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
				.style('opacity', .6);
				/*.transition()
				.duration(500)
				.attr('transform', 'translate(0,0)');*/
			});
		
		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction);
	},
	
	/**
 	 * @function
 	 * @description Draw/transition the chart title
 	 */
	handleChartTitle: function() {
		var me = this;
		
		me.gTitle.selectAll('text').remove();
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#333333')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	},
	
	/**
 	 * @function
 	 * @override
 	 * @memberOf App.util.d3.UniversalBar
 	 * @description Set the horizontal scale, depending on legend on/off
 	 */
	setXScale: function() {
		var me = this;
		
		if(me.showLegend) {
			var legendUnits = me.getFlexUnit() * me.legendFlex;
			
			var diff = me.canvasWidth - me.margins.right - legendUnits;
			
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, diff]);
		} else {
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, me.canvasWidth - me.margins.right]);
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalBar
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
 	 * @memberOf App.util.d3.UniversalBar
 	 * @description Set the scale for the yAxis
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[metric]; })])
			.range([me.canvasHeight-me.margins.bottom, me.canvasHeight - me.heightOffset]);
			
		var useYTicks = me.yTicks;
			
		// figure out the actual y ticks
		var gdMax = d3.max(me.graphData, function(d) { return d[metric];});
		if(gdMax < useYTicks) {
			useYTicks = gdMax;
		}
			
		me.yAxis = d3.svg.axis()
			.scale(me.yAxisScale)
			.orient('left')
			.ticks(useYTicks)
			.tickFormat(me.yTickFormat);
	},
	
	/**
 	 * @function
 	 */
 	checkSort: function() {
	 	var me = this;
	 	
	 	if(me.sortType == '_metric_') {
	 		me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
			 	if(a[me.dataMetric] < b[me.dataMetric]) {
				 	return 1;
				} else if(a[me.dataMetric] > b[me.dataMetric]) {
					return -1;
				} else {
					return 0;
				}
		 	}, me));
		 }
		 
		 if(me.sortType == 'az' && me.sortProperty) {
		 	me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
			 	if(a[me.sortProperty] < b[me.sortProperty]) {
				 	return -1;
				} else if(a[me.sortProperty] > b[me.sortProperty]) {
					return 1;
				} else {
					return 0;
				}
		 	}, me));
		 }
		 
		 if(me.sortType == 'za' && me.sortProperty) {
		 	me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
			 	if(a[me.sortProperty] < b[me.sortProperty]) {
				 	return -1;
				} else if(a[me.sortProperty] > b[me.sortProperty]) {
					return 1;
				} else {
					return 0;
				}
		 	}, me));
		 }
		 
		 if(me.sortType == 'za' && me.sortProperty) {
			me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
			 	if(a[me.sortProperty] < b[me.sortProperty]) {
				 	return 1;
				} else if(a[me.sortProperty] > b[me.sortProperty]) {
					return -1;
				} else {
					return 0;
				}
		 	}, me));
		 }
 	},
 	
	/**
     * @function
     * @description Publish a mouse event with the event relay
     * @param evt String mouseover|mouseout|etc..
     * @param d Object Data object
     * @param i Integer index
     */
    publishMouseEvent: function(evt, d, i) {
        var me = this;

        if(me.handleEvents && me.eventRelay && me.mouseEvents[evt].enabled) {
            me.eventRelay.publish(me.mouseEvents[evt].eventName, {
                payload: d,
                index: i
            });
        }
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
			- me.margins.right;
			
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	},
	
	/**
	 * @function
	 */
	resize: function(w, h) {
		var me = this;
		
		me.canvasWidth = w;
		me.canvasHeight = h;
		me.heightOffset = me.canvasHeight - me.margins.top - me.labelOffsetTop;
		
		var legendTranslateX = me.margins.left 
			+ (me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
				
		me.gLegend.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
		
		me.gTitle.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
		
		me.draw();
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
	
	setGraphData: function(data) {
	 	var me = this;

	 	me.graphData = data;
	},
	
	setLegendTextFunction: function(fn) {
		var me = this;
		
		me.legendTextFunction = fn;
	},
	
	setMaxBarWidth: function(w) {
		var me = this;
		
		me.maxBarWidth = w;
	},
	
	setMetricSort: function(s) {
		var me = this;
		
		me.metricSort = s;
	},
	
	setColorPalette: function(p) {
		var me = this;
		
		me.colorPalette = p;
	},
	
	setColorScale: function() {
		var me = this;
		
		if(me.colorPalette == 'gradient_blue') {
			me.colorScale = d3.scale.linear()
				.domain([
					0,
					Math.floor((me.graphData.length-1) * .33),
					Math.floor((me.graphData.length-1) * .66),
					me.graphData.length-1
				])
				.range([
					colorbrewer.Blues[9][8],
				 	colorbrewer.Blues[9][6],
				 	colorbrewer.Blues[9][4],
				 	colorbrewer.Blues[9][2]
				]);
		} else if(me.colorPalette == 'gradient_red') {
			me.colorScale = d3.scale.linear()
				.domain([
					0,
					Math.floor((me.graphData.length-1) * .33),
					Math.floor((me.graphData.length-1) * .66),
					me.graphData.length-1
				])
				.range([
					colorbrewer.Reds[9][8],
				 	colorbrewer.Reds[9][6],
				 	colorbrewer.Reds[9][4],
				 	colorbrewer.Reds[9][2]
				]);
		} else if(me.colorPalette == 'paired') {
			me.colorScale = d3.scale.ordinal().range(colorbrewer.Paired[12]);
		} else if(me.colorPalette == '20b') {
			me.colorScale = d3.scale.category20b();
		} else {
			me.colorScale = d3.scale.category20();
		}
	},
	
	setTooltipFunction: function(fn) {
		var me = this;
		me.tooltipFunction = fn;
	},
	
	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	},
	
	setShowLegend: function(bool) {
		var me = this;
			
		me.showLegend = bool;
	},
	
	setSortType: function(sortType, sortProperty) {
		var me = this;
		
		me.sortType = sortType || null;
		me.sortProperty = sortProperty || null;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		
		me.yTickFormat = fn;
	}
});