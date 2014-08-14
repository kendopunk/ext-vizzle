/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly configurable grouping bar chart
 */
Ext.define('App.util.d3.UniversalGroupedBar', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	barPadding: 3,
	
	canvasHeight: 400,
	canvasWidth: 400,
	chartFlex: 3,
	chartInitialized: false,
	chartTitle: 'Grouped Bar Chart',
	colorScale: d3.scale.category20(),
	
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	
	fixedColorRange: null,
	fixedColorRangeIndex: null,
	
	gBar: null,
	gBarLabel: null,
	gGrouper: null,
	gLegend: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	graphData: [],
	grouperField: 'grouper',
	labelFontSize: '10px',
	labelMetric: 'name',
	legendFlex: 1,
	legendProperty: 'name',
	legendSquareWidth: 10,
  	legendSquareHeight: 10,
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 100,
		leftAxis: 85
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
	rectOpacity: .7,
	rectStroke: '#323232',
	rectStrokeOver: '#000000',
	
	showLabels: true,
	showLegend: true,
	spaceBetweenChartAndLegend: 20,
	
	tooltipFunction: function(d, i) {
		return 'tooltip';
	},

	xAxis: null,
	xMetric: 'id',
	xScale: null,
	
	yAxis: null,
	yAxisScale: null,
	yMetric: 'value',
	yScale: null,
	
	/**
 	 * constructor
 	 */
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
 	 * @description Initialize chart components
 	 */
 	initChart: function() {
	 	var me = this;
	 	
	 	//////////////////////////////////////////////////
	 	// "g" elements
	 	//////////////////////////////////////////////////
	 	me.gBar = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.left + ', 0)');
	 		
		me.gBarLabel = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.left + ', 0)');
	 		
		me.gGrouper = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.left + ',0)');
	 		
	 	// legend
		var legendTranslateX = me.margins.left 
			+ (me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
	 	
	 	// x
	 	var gXAxisTranslateY = me.canvasHeight - me.margins.bottom;
		me.gXAxis = me.svg.append('svg:g')
			.attr('class','axis')
			.attr('transform', 'translate(' + me.margins.leftAxis + ', ' + gXAxisTranslateY + ')');
		
		// y
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.leftAxis + ', 0)');
		
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
 	 * @description Initial drawing
 	 */
 	draw: function() {
 		var me = this;
 		
		//////////////////////////////////////////////////
		// set X/Y scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		me.setYAxisScale();
		
		//////////////////////////////////////////////////
		// handlers
		// - bars
		// - labels
		// - chart title
		// - axes
		//////////////////////////////////////////////////
		me.handleBars();
		me.handleBarLabels();
		me.handleLegend();
		me.handleChartTitle();
		me.callAxes();
 	},
 	
 	/**
  	 * @function
  	 * @description Handle the drawing/regeneration of bars
  	 */
  	handleBars: function() {
	  	var me = this;
	  	
	  	// local scope
	  	var barPadding = me.barPadding,
 			canvasHeight = me.canvasHeight,
 			canvasWidth = me.canvasWidth,
 			colorScale = me.colorScale,
 			xMetric = me.xMetric,
 			_xScale = me.xScale,
	 		yMetric = me.yMetric,
	 		_yScale = me.yScale,
	 		margins = me.margins,
	 		colorDefinedInData = me.colorDefinedInData,
	 		colorDefinedInDataIndex = me.colorDefinedInDataIndex,
	 		fixedColorRange = me.fixedColorRange,
	 		fixedColorRangeIndex = me.fixedColorRangeIndex;
	 		
	 	////////////////////////////////////////
	 	// RECTANGLES - JRAT
	 	////////////////////////////////////////
	 	var rectSelection = me.gBar.selectAll('rect')
	 		.data(me.graphData);
	 	
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();

		rectSelection.enter()
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.on('mouseover', function(d, i) {
				d3.select(this)
					.style('opacity', 1)
					.style('stroke', me.rectStrokeOver);
					
				me.publishMouseEvent('mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.style('opacity', me.rectOpacity)
					.style('stroke', me.rectStroke);
					
				me.publishMouseEvent('mouseout', d, i);
			});
			
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				return _xScale(d[xMetric]);
			})
			.attr('y', function(d) {
				return canvasHeight - _yScale(d[yMetric]);
			})
			.attr('width', function(d) {
				return _xScale.rangeBand() - barPadding;
			})
			.attr('height', function(d) {
				return _yScale(d[yMetric]) - margins.bottom;
			})
			.style('fill', function(d, i) {
				if(colorDefinedInData) {
					return d[colorDefinedInDataIndex];
				}
				else if(fixedColorRange != null && fixedColorRangeIndex != null) {
					return fixedColorRange[d.name];
				} else {
					return colorScale(i);
				}
			})
			.style('opacity', 0.6)
			.style('stroke', 'black')
			.style('stroke-width', 1);
			
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
 	
 	/**
  	 * @function
  	 * @description Handle bar labels
  	 */
  	handleBarLabels: function() {
  		var me = this;
  		
  		if(!me.showLabels) {
	  		me.gBarLabel.selectAll('text').remove();
	  		return;
	  	}
	  	
	  	// local scope
  		var canvasHeight = me.canvasHeight,
	  		barPadding = me.barPadding,
	  		labelMetric = me.labelMetric,
	  		margins = me.margins,
	  		_xScale = me.xScale,
	  		xMetric = me.xMetric;
	  	
	  	////////////////////////////////////////
	  	// LABEL - JRAT
	  	////////////////////////////////////////
  		var labelSelection = me.gBarLabel.selectAll('text')
	  		.data(me.graphData);
	  	
	  	labelSelection.exit().remove();
	  	
	  	labelSelection.enter()
	  		.append('text')
	  		.attr('class', 'labelText')
	  		.style('text-anchor', 'start');
	  		
	  	labelSelection.transition()
	  		.duration(500)
	  		.attr('x', function(d, i) {
		  		return _xScale(d[xMetric]) + parseInt((_xScale.rangeBand() - barPadding)/2);
		  	})
		  	.attr('y', function(d) {
			  	return canvasHeight - parseInt(margins.bottom * 1.2);
			})
			.attr('transform', function(d) {
				// rotation needs to happen around the text's X and Y position
				var x = _xScale(d[xMetric]) + parseInt((_xScale.rangeBand() - barPadding)/2);
				var y = canvasHeight - parseInt(margins.bottom * 1.2);
				return 'rotate(-90,' + x + ',' + y + ')';
			})
		  	.text(function(d) {
			  	return d[labelMetric];
			});
  	},
  	
  	/**
   	 * @function
   	 * @description Call X/Y axes
   	 */
   	callAxes: function() {
	   	var me = this;
	   	
	   	me.gXAxis.transition().duration(500).call(me.xAxis);
	   	me.gYAxis.transition().duration(500).call(me.yAxis);
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
			legendSquareWidth = me.legendSquareWidth,
			fixedColorRange = me.fixedColorRange,
			fixedColorRangeIndex = me.fixedColorRangeIndex,
			legendProperty = me.legendProperty;
		
		////////////////////////////////////////
		// create legend data from graphData
		////////////////////////////////////////	
		var legendData = Ext.Array.unique(
			Ext.Array.map(me.graphData, function(item) {
				return item[legendProperty];
			}, me)
		);
			
		////////////////////////////////////////
		// LEGEND SQUARES - JRAT
		////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
			.data(legendData);
				
		legendSquareSelection.exit().remove();
			
		legendSquareSelection.enter().append('rect')
			.style('opacity', me.rectOpacity)
			.on('mouseover', function(d, i) {
				d3.select(this)
					.style('stroke', '#000000')
					.style('opacity', 1);
					
				bars.selectAll('rect').filter(function(e, j) {
						return e[legendProperty] == d;
					})
					.style('stroke', me.rectStrokeOver)
					.style('opacity', 1);
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.style('stroke', 'none')
					.style('opacity', me.rectOpacity);
					
				bars.selectAll('rect').filter(function(e, j) {
						return e[legendProperty] == d;
					})
					.style('stroke', me.rectStroke)
					.style('opacity', me.rectOpacity);
			});
		
		legendSquareSelection.transition()
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.style('fill', function(d, i) {
				if(fixedColorRange != null && fixedColorRangeIndex != null) {
					return fixedColorRange[d];
				} else {
					return colorScale(i);
				}
			});
		
		////////////////////////////////////////
		// LEGEND TEXT - JRAT
		////////////////////////////////////////
		var legendTextSelection = me.gLegend.selectAll('text')
			.data(legendData);
				
		legendTextSelection.exit().remove();
			
		legendTextSelection.enter().append('text')
			.style('cursor', 'default')
			.attr('class', 'legendText')
			.on('mouseover', function(d, i) {
				// highlight text
				d3.select(this)
					.style('fill', '#990066')
					.style('font-weight', 'bold');
					
				bars.selectAll('rect').filter(function(e, j) {
					return e[legendProperty] == d;
				})
				.style('stroke', '#000000')
				.style('stroke-width', 2)
				.style('opacity', 1);
			})
			.on('mouseout', function(d, i) {
				// un-highlight text
				var el = d3.select(this);
				el.style('fill', '#000000')
					.style('font-weight', 'normal');
					
				bars.selectAll('rect').filter(function(e, j) {
					return e[legendProperty] == d;
				})
				.style('stroke', 0)
				.style('stroke-width', null)
				.style('opacity', .6);
			});
		
		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(function(d) {
				return d.toUpperCase();
			});
	},
	
	/**
 	 * @function
 	 * @description Draw/transition the chart title
 	 */
	handleChartTitle: function() {
		var me = this,
			ct;
		
		if(me.chartTitle == null) {
			ct = '';
		} else {
			ct = me.chartTitle;
		}
		
		me.gTitle.selectAll('text').remove();
		
		me.gTitle.selectAll('text')
			.data([ct])
			.enter()
			.append('text')
			.style('fill', '#333333')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.style('text-anchor', 'middle')
			.text(String);
	},
	
	/**
 	 * @function
 	 * @description Instead of the standard X axis, we use a grouping mechanism
 	 * to display X axis information
 	 * @param clearFirst Boolean
 	 */
 	triggerGroupers: function(clearFirst) {
 		var me = this;
 		
 		var xScale = me.xScale,
	 		barPadding = me.barPadding,
	 		graphData = me.graphData,
	 		lineData = [],
	 		finalData = [],
	 		workingGroupers = [],
	 		grouperField = me.grouperField;
	 		
	 	if(clearFirst) {
		 	me.gGrouper.selectAll('path').remove();
		 	me.gGrouper.selectAll('text').remove();
		}

 		////////////////////////////////////////
 		// unique array of "grouper" fields
 		////////////////////////////////////////
 		workingGroupers = Ext.Array.unique(Ext.pluck(me.graphData, grouperField));
 		if(workingGroupers.length == 0) {
	 		return;
	 	}
	 	
	 	////////////////////////////////////////
	 	// run through the groupers and configure
	 	// the line data
	 	////////////////////////////////////////
	 	var ind = 0;
	 	Ext.each(workingGroupers, function(grouper) {
	 		var g = grouper;
	 		
	 		lineData.push({
		 		group: g,
		 		data: []	// empty
		 	});
		 	
		 	Ext.each(me.graphData, function(rec) {
			 	if(rec[grouperField] == grouper) {
				 	lineData[ind].data.push(rec.id);
				}
			});
			
			ind++;
		});
		
		////////////////////////////////////////
		// now, finalize the data with "pathData"
		// array/object for use in the path generation
		// function
		////////////////////////////////////////
		Ext.each(lineData, function(d) {
			finalData.push({
			 	group: d.group,
			 	pathData: [{
				 	x: xScale(d.data[0]),
				 	y: me.canvasHeight - me.margins.bottom + 10
			 	}, {
			 		x: xScale(d.data[0]),
				 	y: me.canvasHeight - me.margins.bottom + 18
			 	}, {
			 		x: xScale(d.data[d.data.length-1]) + xScale.rangeBand() - barPadding,
			 		y: me.canvasHeight - me.margins.bottom + 18
			 	}, {
			 		x: xScale(d.data[d.data.length-1]) + xScale.rangeBand() - barPadding,
			 		y: me.canvasHeight - me.margins.bottom + 10
			 	}]
			 });
		 });
		 
		 ////////////////////////////////////////
		 // generic path function
		 ////////////////////////////////////////
		 var pathFn = d3.svg.line()
		 	.x(function(d) { return d.x; })
		 	.y(function(d) { return d.y; })
		 	.interpolate('linear');
		 
		 ////////////////////////////////////////
		 // draw the paths
		 ////////////////////////////////////////
		 me.gGrouper.selectAll('path')
			 .data(finalData)
			 .enter()
			 .append('path')
			 .attr('d', function(dat) {
			 	return pathFn(dat.pathData);
			 })
			 .attr('stroke', 'SeaGreen')
			 .attr('shape-rendering', 'crispEdges')
			 .attr('stroke-width', 1)
			 .attr('fill', 'none');
			 	
		////////////////////////////////////////
		// generate the text
		////////////////////////////////////////
		me.gGrouper.selectAll('text')
			.data(finalData)
			.enter()
			.append('text')
			.attr('x', function(d) {
				var xMin = d.pathData[0].x;
				var xMax = d.pathData[d.pathData.length-1].x;
				
				return parseInt((xMin + xMax)/2);
			})
			.attr('y', me.canvasHeight - me.margins.bottom + 30)
			.style('font-family', 'sans-serif')
			.style('font-size', '9px')
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d.group;
			});
 	},
 	
 	/**
 	 * @function
 	 * @description Set the X-scaling value
 	 */
 	setXScale: function() {
	 	var me = this;
	 	
	 	var graphData = me.graphData,
		 	xMetric = me.xMetric;
		
		if(me.showLegend) {
			var legendUnits = me.getFlexUnit() * me.legendFlex,
				diff = me.canvasWidth - me.margins.left - me.margins.right - legendUnits;
			
			me.xScale = d3.scale.ordinal()
		 		.domain(graphData.map(function(item) {
			 		return item[xMetric];
				 }))
		 		.rangeRoundBands([0, diff], .08);
		 		
		 		/*
		 		var legendUnits = me.getFlexUnit() * me.legendFlex;
			
			var diff = me.canvasWidth - me.margins.right - legendUnits;
			
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, diff]);*/
				
		} else {
			me.xScale = d3.scale.ordinal()
		 		.domain(graphData.map(function(item) {
			 		return item[xMetric];
				 }))
		 		.rangeRoundBands([0, me.canvasWidth - me.margins.right - me.margins.left], .08);
		}
		 	
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.tickFormat(function(d) {
				return '';
			})
			.orient('bottom');
	},
	
	/**
	 * @function
	 * @description Set the Y scaling
	 */
	setYScale: function() {
		var me = this;
		
		var yMetric = me.yMetric;
		
		me.yScale = d3.scale.linear()
			.domain([d3.max(me.graphData, function(d) { return d[yMetric]; }), 0])
			.range([
				me.canvasHeight - me.margins.top,
				me.margins.bottom
			]);
	},
	
	/**
 	 * @function
 	 * @description Set the scale for the yAxis (different range)
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		var yMetric = me.yMetric;
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[yMetric]; })])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.canvasHeight - (me.canvasHeight - me.margins.top)
			]);
			
		// figure out actual y ticks
		var useYTicks = 10;
		var gdMax = d3.max(me.graphData, function(d) { return d[yMetric]; });
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
	
	getFlexUnit: function() {
		// calculate the width of a flex "unit"
		var me = this;
			
		var workingWidth = me.canvasWidth
			- me.margins.left
			- me.margins.right;
			
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	},
 	
 	/**
  	 *
  	 *
  	 * SETTERS
  	 *
  	 *
  	 */
	setChartTitle: function(title) {
		var me = this;
		me.chartTitle = title;
	},
	
	setGraphData: function(d) {
	  	var me = this;
	  	me.graphData = d;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		me.showLabels = bool;
	},
	
	setShowLegend: function(bool) {
		var me = this;
		me.showLegend = bool;
	},
	
	setTooltipFunction: function(fn) {
		var me = this;
		me.tooltipFunction = fn;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		me.yTickFormat = fn;
	}
});