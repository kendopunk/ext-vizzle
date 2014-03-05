/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Stacked bar chart class
 */
Ext.define('App.util.d3.final.StackedBarChart', {
	
	/**
 	 * The primary SVG element.  Must be set (after render) outside this class
 	 * and passed as a configuration item
 	 */
 	svg: null,
 	
 	/**
  	 * other configs
  	 */
  	barPadding: 5,
  	canvasHeight: 500,
  	canvasWidth: 500,
  	chartFlex: 3,
  	chartOrientation: 'vertical',
  	chartTitle: null,
  	colorRangeStart: null,
  	colorRangeEnd: null,
  	colorScale: d3.scale.category10(),
  	eventRelay: null,
  	gCanvas: null,
  	gLabel: null,
   	gLayer: null,
   	gLegend: null,
   	gTitle: null,
   	gXAxis: null,
   	gYAxis: null,
   	graphData: [],
   	handleEvents: false,
   	labelFunction: function(data, index) {
		return 'label';
	},
	labelValign: 'middle',
   	layers: null,
   	legendFlex: 1,
   	legendFontSize: '9px',
   	legendSquareHeight: 10,
   	legendSquareWidth: 10,
   	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
   	margins: {
    	top: 20,
    	right: 20,
    	bottom: 20,
    	left: 20
    },
    maxValue: null,		// maximum X or Y value, depending on orientation
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
   	panelId: null,
   	showLabels: false,
   	showLegend: false,
   	spaceBetweenChartAndLegend: 20,
   	stackLayout: null,
   	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
    xAxis: null,
    xScale: null,
    xTickFormat: function(d) {
 		return Ext.util.Format.number(d, '0,000');
	},
    yAxis: null,
    yScale: null,
    yTickFormat: function(d) {
 		return Ext.util.Format.number(d, '0,000');
	},
    uniqueIds: [],
    
    /**
     * constructor
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
 	 * @memberOf App.util.d3.final.StackedBarChart
 	 * @description Initial drawing
 	 */
 	draw: function() {
 		var me = this;
 		
 		//////////////////////////////////////////////////
 		// bring configuration vars into local scope
 		//////////////////////////////////////////////////
 		var svg = me.svg,
 			barPadding = me.barPadding,
 			canvasWidth = me.canvasWidth,
 			canvasHeight = me.canvasHeight,
 			panelId = me.panelId,
 			margins = me.margins,
 			legendSquareWidth = me.legendSquareWidth,
 			legendSquareHeight = me.legendSquareHeight,
 			handleEvents = me.handleEvents,
 			eventRelay = me.eventRelay,
 			mouseEvents = me.mouseEvents,
 			labelVAlign = me.labelVAlign,
 			chort = me.chartOrientation;
 			
		//////////////////////////////////////////////////
		// initialize color scale
		//////////////////////////////////////////////////
		if(me.colorRangeStart != null && me.colorRangeEnd != null) {
			me.colorScale = d3.scale.linear()
		 		.domain([0, me.graphData.length - 1])
		 		.range([me.colorRangeStart, me.colorRangeEnd]);
		}
		var colorScale = me.colorScale;
		 
		//////////////////////////////////////////////////
		// get the array of unique "id" properties
		//////////////////////////////////////////////////
		me.setUniqueIds();
		
		//////////////////////////////////////////////////
		// set the stack layout
		//////////////////////////////////////////////////
		me.stackLayout = d3.layout.stack().values(function(d) {
			return d.values;
		});
		
		//////////////////////////////////////////////////
		// apply the stack function to layers variable
		//////////////////////////////////////////////////
		me.layers = me.stackLayout(me.graphData);
		
		//////////////////////////////////////////////////
		// get and set the max value from the data
		//////////////////////////////////////////////////
		me.setMaxValue();
		
		//////////////////////////////////////////////////
		// set X and Y scales, bring into local scope
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		var _xScale = me.xScale,
			 _yScale = me.yScale;
		
		//////////////////////////////////////////////////
		// canvas "g"
		// title "g"
		// legend "g"
		// x axis "g"
		// y axis "g"
		// layers "g"
		//////////////////////////////////////////////////
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
			
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
			
		var legendTranslateX = me.margins.left
			+ (me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' +  margins.top + ')');
			
		var g_ax_translate = canvasHeight - margins.top - margins.bottom;
		me.gXAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + g_ax_translate + ')');
			
		me.gYAxis = me.gCanvas.append('svg:g').attr('class', 'axis');	
		
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers)
			.enter()
			.append('g')
			.attr('class', 'layer')
			.style('fill', function(d, i) {
				return colorScale(i);
			});
			
		//////////////////////////////////////////////////
		// BARS
		//////////////////////////////////////////////////
		me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			})
			.enter()
			.append('rect')
			.style('stroke', 'black')
			.style('stroke-width', 0.5)
			.style('opacity', .6)
			.attr('x', function(d) {
				if(chort == 'horizontal') {
					return _xScale(d.y0);
				} else {
					return _xScale(d.id);
				}
			})
			.attr('width', function(d) {
				if(chort == 'horizontal') {
					return _xScale(d.y0 + d.y) - _xScale(d.y0);
				} else {
					return _xScale.rangeBand();
				}
			})
			.attr('y', function(d) {
				if(chort == 'horizontal') {
					return _yScale(d.id);
				} else {
					return _yScale(d.y0 + d.y);
				}
			})
			.attr('height', function(d) {
				if(chort == 'horizontal') {
					return _yScale.rangeBand() - barPadding;
				} else {
					return _yScale(d.y0) - _yScale(d.y0 + d.y);
				}
			})
			.on('mouseover', function(d, i) {
				d3.select(this).style('stroke-width', 2).style('opacity', 1);
					
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(
						mouseEvents.mouseover.eventName,
						{
							payload: d,
							index: i
						}
					);
				}
				
				/*
				if(me.showLegend) {
					me.gLegend.selectAll('text').filter(function(e, j) {
						return e.category == d.category;
					})
					.style('fill', '#990066')
					.style('font-weight', 'bold');
				}
				*/
			})
			.on('mouseout', function(d, i) {
				d3.select(this).style('stroke-width', 1).style('opacity', .6);
				
				/*
				if(me.showLegend) {
					me.gLegend.selectAll('text').filter(function(e, j) {
						return e.category == d.category;
					})
					.style('fill', '#000000')
					.style('font-weight', 'normal');
				}
				*/
			})
			.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		//////////////////////////////////////////////////
		// LABELS, if applicable
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.handleLabels();
		}
		
		//////////////////////////////////////////////////
		// LEGEND, if applicable
		//////////////////////////////////////////////////
		if(me.showLegend) {
			me.handleLegend();
		}
		
		//////////////////////////////////////////////////
		// CALL X/Y
		//////////////////////////////////////////////////
		me.gXAxis.call(me.xAxis);
		me.gYAxis.call(me.yAxis);
		
		//////////////////////////////////////////////////
		// CHART TITLE
		//////////////////////////////////////////////////
		me.handleChartTitle();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.StackedBarChart
 	 * @description Transition stacked bar chart layout with new data
 	 */
	transition: function(fap) {
		var me = this;
		
		//////////////////////////////////////////////////
		// set new layers
		//////////////////////////////////////////////////
		me.layers = me.stackLayout(me.graphData);
		
		//////////////////////////////////////////////////
		// set the new unique IDs, scales and max value
		//////////////////////////////////////////////////
		me.setUniqueIds();
		me.setMaxValue();
		me.setXScale();
		me.setYScale();
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var _xScale = me.xScale,
			_yScale = me.yScale,
			barPadding = me.barPadding,
			colorScale = me.colorScale,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			labelVAlign = me.labelVAlign,
			chort = me.chartOrientation;
			
		//////////////////////////////////////////////////
		// LAYER TRANSITION
		//////////////////////////////////////////////////
		// join new layers
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers);
			
		// transition out old layers
		me.gLayer.exit().remove();

		// add new layers
		me.gLayer.enter()
			.append('g')
			.attr('class', 'layer');
			
		// transition the color of all layers
		me.gLayer.transition()
			.style('fill', function(d, i) {
				return colorScale(i);
			});
			
		//////////////////////////////////////////////////
		// RECTANGLE TRANSITION
		//////////////////////////////////////////////////
		// join new data with old
		var rectSelection = me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			});
			
		// transition out the old rectangles
		rectSelection.exit()
			.transition()
			.attr('width', 0)
			.duration(500)
			.remove();
			
		// add new rect elements
		rectSelection.enter()
			.append('rect');
			
		// transition all 
		rectSelection.transition()
			.duration(500)
			.style('stroke', 'black')
			.style('stroke-width', 0.5)
			.style('opacity', .6)
			.attr('x', function(d) {
				if(chort == 'horizontal') {
					return _xScale(d.y0);
				} else {	
					return _xScale(d.id);
				}
			})
			.attr('width', function(d) {
				if(chort == 'horizontal') {
					return _xScale(d.y0 + d.y) - _xScale(d.y0);
				} else {
					return _xScale.rangeBand();
				}
			})
			.attr('y', function(d) {
				if(chort == 'horizontal') {
					return _yScale(d.id);
				} else {
					return _yScale(d.y0 + d.y);
				}
			})
			.attr('height', function(d) {
				if(chort == 'horizontal') {
					return _yScale.rangeBand() - barPadding;
				} else {
					return _yScale(d.y0) - _yScale(d.y0 + d.y);
				}
			});
			
		// call events
		rectSelection.on('mouseover', function(d, i) {
			d3.select(this).style('stroke-width', 2).style('opacity', 1);
			
			if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
				eventRelay.publish(
					mouseEvents.mouseover.eventName,
					{
						payload: d,
						index: i
					}
				);
			}
		})
		.on('mouseout', function(d, i) {
			d3.select(this).style('stroke-width', 1).style('opacity', .6);
		});

		// call tooltip function
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		//////////////////////////////////////////////////
		// LABELS, if applicable
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.handleLabels();
		} else {
			me.gCanvas.selectAll('.label').data([]).exit().remove();
		}
		
		//////////////////////////////////////////////////
		// LEGEND, if applicable
		//////////////////////////////////////////////////
		if(me.showLegend) {
			me.handleLegend();
		}
		
		//////////////////////////////////////////////////
		// CHART TITLE
		//////////////////////////////////////////////////
		me.handleChartTitle();
		
		//////////////////////////////////////////////////
		// TRANSITION AXES
		//////////////////////////////////////////////////
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
	},
 	
	/**
	 * @function
	 * @description Handle the bar chart labels
	 */
	handleLabels: function() {
		var me = this;
		
		//
		// local scope
		//
		var chort = me.chartOrientation,
			_xScale = me.xScale,
			_yScale = me.yScale,
			labelVAlign = me.labelVAlign;
		
		// join new layers
		me.gLabel = me.gCanvas.selectAll('.label')
			.data(me.layers);
			
		// transition out old labels
		me.gLabel.exit().remove();
		
		// add new
		var addedLabels = me.gLabel.enter()
			.append('g')
			.attr('class', 'label');
				
		// text transition
		var textSelection = me.gLabel.selectAll('text')
			.data(function(d) {
					return d.values;
			});
			
		// transition out old text
		textSelection.exit()
			.transition()
			.attr('x', 1000)
			.duration(500)
			.remove();
				
		// add new text elements
		textSelection.enter()
			.append('text');
			
		// transition all
		textSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				if(chort == 'horizontal') {
					return _xScale(d.y0 + d.y) + Math.floor((_xScale(d.y0) - _xScale(d.y0 + d.y))/2);
				} else {
					// scaled X position + (rectWidth / 2)
					return _xScale(d.id) + Math.floor(_xScale.rangeBand()/2);
				}
			})
			.attr('y', function(d) {
				if(chort == 'horizontal') {
					// _yScale(d.id) is upper left corner of rectangle
					if(labelVAlign == 'bottom') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .85);
					} else if(labelVAlign == 'top') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .15);
					} else {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand()/2);
					}
				} else {
					if(labelVAlign == 'bottom') {
						return _yScale(d.y0 + d.y) + Math.floor((_yScale(d.y0) - _yScale(d.y0 + d.y)) * .9);
					} else if(labelVAlign == 'top') {
						return _yScale(d.y0 + d.y) + Math.floor((_yScale(d.y0) - _yScale(d.y0 + d.y)) * .1);
					} else {
						return _yScale(d.y0 + d.y) + Math.floor((_yScale(d.y0) - _yScale(d.y0 + d.y))/2);
					}
				}
			})
			.style('font-family', 'sans-serif')
			.style('font-size', '9px')
			.style('text-anchor', 'middle')
			.text(me.labelFunction);
	},
	
	/**
 	 * @function
 	 * @description Handle the legend
 	 */
 	handleLegend: function() {
	 	var me = this;
	 	
	 	// local scope
	 	var legendSquareHeight = me.legendSquareHeight,
	 		legendSquareWidth = me.legendSquareWidth,
	 		colorScale = me.colorScale,
	 		gCanvas = me.gCanvas;
	 		
	 	////////////////////////////////////////
	 	// legend rectangles
	 	////////////////////////////////////////
	 	// join new with old
	 	var legendSquareSelection = me.gLegend.selectAll('rect')
		 	.data(me.graphData);
		 	
		// remove old squares
		legendSquareSelection.exit().remove();
		
		// add new squares
		legendSquareSelection.enter().append('rect');
		
		// transition all
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
	 	// legend text
	 	////////////////////////////////////////
	 	// join new text with current text
	 	var legendTextSelection = me.gLegend.selectAll('text')
		 	.data(me.graphData);
		
		// remove old text
		legendTextSelection.exit().remove();
			
		// add new
		legendTextSelection.enter().append('text')
			.on('mouseover', function(d, i) {
				// highlight text
				d3.select(this).style('fill', '#990066').style('font-weight', 'bold');
				
				// rect opacity 1
				gCanvas.selectAll('.layer').filter(function(e, j) {
					return i == j;
				})
				.selectAll('rect')
				.style('stroke-width', 2)
				.style('opacity', 1);
			})
			.on('mouseout', function(d, i) {
				// unhighlight text
				d3.select(this).style('fill', '#000000').style('font-weight', 'normal');
				
				// rect opacity .6
				gCanvas.selectAll('.layer').filter(function(e, j) {
					return i == j;
				})
				.selectAll('rect')
				.style('stroke-width', 1)
				.style('opacity', .6);
			});
			
		// transition all
		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.style('font-size', me.legendFontSize)
			.text(function(d) {
				return d.category.toUpperCase();
			});
	},
	
	/**
 	 * @function
 	 * @description Handle the chart title
 	 */
 	handleChartTitle: function() {
	 	var me = this;
	 	
	 	var ct = me.chartTitle == null ? '' : me.chartTitle;
	 	
	 	me.gTitle.selectAll('text').remove();
	 	
		me.gTitle.selectAll('text')
			.data([ct])
			.enter()
			.append('text')
			.style('fill', '#333333')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.text(function(d) {
				return d;
			});
	},
	
	/**
	 *
	 *
	 * getters
	 *
	 *
	 */
	getFlexUnit: function() {
		var me = this;
	
		var workingWidth = me.canvasWidth
			- me.margins.left
			- me.margins.right
			- me.spaceBetweenChartAndLegend;
			
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));	
	},
	
	/**
	 *
	 *
	 * setters
	 *
	 *
	 */
	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	},
	
	setColorScale: function(startColor, endColor) {
	 	var me = this;
	 	
	 	me.colorScale = d3.scale.linear()
		 	.domain([0, me.graphData.length - 1])
		 	.range([startColor, endColor]);
	},
	
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
		
		// changing the graph data changes the color scale, if applicable
		// and not using category20() etc
		if(me.colorRangeStart != null & me.colorRangeEnd != null) {
			me.colorScale = d3.scale.linear()
		 		.domain([0, data.length - 1])
		 		.range([me.colorRangeStart, me.colorRangeEnd]);
		}
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		
		me.labelFunction = fn;
	},
	
	setLabelVAlign: function(align) {
		var me = this;
		
		me.labelVAlign = align;
	},
	
	setMaxValue: function() {
		var me = this;
		
		// max Y value (y0) is the position on the Y scale
		// where a particular rectangle ends
		me.maxValue = d3.max(me.layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		}, me);
	},
	
	setOrientation: function(ort) {
		var me = this;
		
		me.chartOrientation = ort;
	},
	
	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	},
	
	setTooltipFunction: function(fn) {
		var me = this;

		me.tooltipFunction = fn;
	},
	
	setXScale: function() {
		var me = this;
		var chartUnits = me.getFlexUnit() * me.chartFlex;
		
		//
		// horizontal orientation
		//
		if(me.chartOrientation == 'horizontal')
		{
			if(me.showLegend) {
				me.xScale = d3.scale.linear()
				.domain([0, me.maxValue])
				.range([0, chartUnits], 0.8);
			} else {
				me.xScale = d3.scale.linear()
				.domain([0, me.maxValue])
				.range([0, me.canvasWidth - me.margins.right - me.margins.left]);
			}
			
			me.xAxis = d3.svg.axis()
				.scale(me.xScale)
				.tickSize(0)
				.tickPadding(6)
				.tickFormat(me.xTickFormat)
				.orient('bottom');
		}
		//
		// vertical orientation
		//
		else 
		{
			if(me.showLegend) {
				me.xScale = d3.scale.ordinal()
					.domain(me.uniqueIds)
					.rangeRoundBands([0, chartUnits], .08);
			} else {
				me.xScale = d3.scale.ordinal()
					.domain(me.uniqueIds)
					.rangeRoundBands([0, me.canvasWidth - me.margins.right - me.margins.left], .08);
			}
			
			me.xAxis = d3.svg.axis()
				.scale(me.xScale)
				.tickSize(0)
				.tickPadding(6)
				.orient('bottom');
		}
	},

	setYScale: function() {
		var me = this;
		
		//
		// horizontal orientation
		//
		if(me.chartOrientation == 'horizontal') {
			me.yScale = d3.scale.ordinal()
				.domain(me.uniqueIds)
				.rangeRoundBands([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);

			me.yAxis = d3.svg.axis()
				.scale(me.yScale)
				.tickSize(0)
				.tickPadding(20)
				.orient('left');	
		}
		//
		// vertical orientation
		//
		else
		{
			me.yScale = d3.scale.linear()
				.domain([0, me.maxValue])
				.range([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);
				
			me.yAxis = d3.svg.axis()
				.scale(me.yScale)
				.tickSize(0)
				.tickPadding(6)
				.tickFormat(me.yTickFormat)
				.orient('left');
		}
	},
	
	setXTickFormat: function(fn) {
		var me = this;
		
		me.xTickFormat = fn;
	},
	
	setYTickFormat: function(fn) {
	 	var me = this;
	 	
	 	me.yTickFormat = fn;
	},
	
	setUniqueIds: function() {
		var me = this;
		
		me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
	}
});