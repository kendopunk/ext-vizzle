/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
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
  	canvasHeight: 500,
  	canvasWidth: 500,
  	chartFlex: 3,
  	chartTitle: null,
  	colorRangeEnd: '#F4A460',
    colorRangeStart: '#4682B4',
  	colorScale: d3.scale.category20(),
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
	orientation: 'vertical',
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
 	 * @memberOf App.util.d3.StackedBarChart
 	 * @description Initial drawing
 	 */
 	draw: function() {
 		var me = this;
 		
 		//////////////////////////////////////////////////
 		// bring configuration vars into local scope
 		//////////////////////////////////////////////////
 		var svg = me.svg,
 			canvasWidth = me.canvasWidth,
 			canvasHeight = me.canvasHeight,
 			panelId = me.panelId,
 			margins = me.margins,
 			legendSquareWidth = me.legendSquareWidth,
 			legendSquareHeight = me.legendSquareHeight,
 			handleEvents = me.handleEvents,
 			eventRelay = me.eventRelay,
 			mouseEvents = me.mouseEvents,
 			showLegend = me.showLegend;
 			
		//////////////////////////////////////////////////
		// initialize color scale
		//////////////////////////////////////////////////
		var colorScale = me.colorScale = d3.scale.linear()
		 	.domain([0, me.graphData.length - 1])
		 	.range([me.colorRangeStart, me.colorRangeEnd]);
		 
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
		// "gCanvas" element
		//////////////////////////////////////////////////
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
			
		//////////////////////////////////////////////////
		// "gLegend" element, if applicable
		//////////////////////////////////////////////////
		me.gLegend = me.svg.append('svg:g');
		if(showLegend) {
			var legendTranslateX = me.margins.left + 
				(me.getFlexUnit() * me.chartFlex)
				+ me.spaceBetweenChartAndLegend;
			me.gLegend = me.svg.append('svg:g')
				.attr('transform', 'translate(' + legendTranslateX + ', ' +  margins.top + ')');
		}
		
		//////////////////////////////////////////////////
		// "gLayer" element
		//////////////////////////////////////////////////
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers)
			.enter()
			.append('g')
			.attr('class', 'layer')
			.style('fill', function(d, i) {
				return colorScale(i);
			});
			
		//////////////////////////////////////////////////
		// draw rectangles
		//////////////////////////////////////////////////
		me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			})
			.enter()
			.append('rect')
			.attr('fill-opacity', .6)
			.attr('stroke', 'black')
			.style('stroke-width', 0.5)
			.attr('width', me.xScale.rangeBand())
			.attr('x', function(d) {
				return _xScale(d.id);
			})
			.attr('y', function(d) {
				return _yScale(d.y0 + d.y);
			})
			.attr('height', function(d) {
				return _yScale(d.y0) - _yScale(d.y0 + d.y);
			})
			.on('mouseover', function(d, i) {
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
			.call(d3.helper.tooltip().text(me.tooltipFunction));
			
		//////////////////////////////////////////////////
		// LABELS / TEXT
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.gLabel = me.gCanvas.selectAll('.label')
				.data(me.layers)
				.enter()
				.append('g')
				.attr('class', 'label')
				.selectAll('text')
				.data(function(d) {
					return d.values;
				})
				.enter()
				.append('text')
				.attr('x', function(d) {
					// scaled X position + (rectWidth / 2)
					return _xScale(d.id) + Math.floor(_xScale.rangeBand()/2);
				})
				.attr('y', function(d) {
					// scaled yPos + (scaledHeight / 2)
					return _yScale(d.y0 + d.y) + Math.floor((_yScale(d.y0) - _yScale(d.y0 + d.y))/2);
				})
				.style('font-family', 'sans-serif')
				.style('font-size', '9px')
				.style('text-anchor', 'middle')
				.text(me.labelFunction);
		}

		//////////////////////////////////////////////////
		// X axis
		//////////////////////////////////////////////////
		var g_ax_translate = canvasHeight - margins.top - margins.bottom;
		me.gXAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + g_ax_translate + ')');
		me.gXAxis.call(me.xAxis);
		
		//////////////////////////////////////////////////
		// Y axis
		//////////////////////////////////////////////////
		me.gYAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis');	
		me.gYAxis.call(me.yAxis);
		
		//////////////////////////////////////////////////
		// LEGEND, if applicable
		//////////////////////////////////////////////////
		if(showLegend) {
			// legend rectangles
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
				});
				
			// legend text
			me.gLegend.selectAll('text')
				.data(me.graphData)
				.enter()
				.append('text')
				.attr('x', legendSquareWidth * 2)
				.attr('y', function(d, i) {
					return i * legendSquareHeight * 1.75;
				})
				.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
				.style('font-size', me.legendFontSize)
				.text(function(d) {
					return d.category.toUpperCase();
				});
		}
		
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
 	 * @memberOf App.util.d3.StackedBarChart
 	 * @description Transition stacked bar chart layout with new data
 	 */
	transition: function() {
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
			colorScale = me.colorScale,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			showLegend = me.showLegend;
			
		//////////////////////////////////////////////////
		// LAYER TRANSITION
		//////////////////////////////////////////////////
		// join new layers
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers);
			
		// transition out old layers
		me.gLayer.exit().remove();

		// add new layers
		var addedLayers = me.gLayer.enter()
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
			.attr('fill-opacity', .6)
			.attr('stroke', 'black')
			.style('stroke-width', 0.5)
			.attr('width', _xScale.rangeBand())
			.attr('x', function(d) {
				return _xScale(d.id);
			})
			.attr('y', function(d) {
				return _yScale(d.y0 + d.y);
			})
			.attr('height', function(d) {
				return _yScale(d.y0) - _yScale(d.y0 + d.y);
			});
			
		// call events
		rectSelection.on('mouseover', function(d, i) {
			if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
				eventRelay.publish(
					mouseEvents.mouseover.eventName,
					{
						payload: d,
						index: i
					}
				);
			}
		});

		// call tooltip function
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));	
			
		//////////////////////////////////////////////////
		// LABEL TRANSITION
		//////////////////////////////////////////////////
		if(me.showLabels) {
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
					// scaled X position + (rectWidth / 2)
					return _xScale(d.id) + Math.floor(_xScale.rangeBand()/2);
				})
				.attr('y', function(d) {
					// scaled yPos + (scaledHeight / 2)
					return _yScale(d.y0 + d.y) + Math.floor((_yScale(d.y0) - _yScale(d.y0 + d.y))/2);
				})
				.style('font-family', 'sans-serif')
				.style('font-size', '9px')
				.style('text-anchor', 'middle')
				.text(me.labelFunction);
		} else {
			me.gCanvas.selectAll('.label').data([]).exit().remove()
		}
		
		//////////////////////////////////////////////////
		// TRANSITION AXES
		//////////////////////////////////////////////////
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
		
		//////////////////////////////////////////////////
		// LEGEND TRANSITION
		//////////////////////////////////////////////////
		if(showLegend) {
			
			/**
 			 * legend rectangles
 			 */
			// join new squares with current squares
			var legendSquareSelection = me.gLegend.selectAll('rect')
				.data(me.graphData);
			
			// remove old text
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
				
			/**
 			 * legend text
 			 */
			// join new text with current text
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(me.graphData);
				
			// remove old text
			legendTextSelection.exit().remove();
			
			// add new
			legendTextSelection.enter().append('text');
			
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
		}
		
		//////////////////////////////////////////////////
		// ADJUST THE REPORT TITLE
		//////////////////////////////////////////////////
		me.gTitle.selectAll('text')
			.text(me.chartTitle);
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
		
		// changing the graph data changes the color scale
		me.colorScale = d3.scale.linear()
		 	.domain([0, data.length - 1])
		 	.range([me.colorRangeStart, me.colorRangeEnd]);
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		
		me.labelFunction = fn;
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
		
		if(me.showLegend) {
			var chartUnits = me.getFlexUnit() * me.chartFlex;
		
			me.xScale = d3.scale.ordinal()
				.domain(me.uniqueIds)
				.rangeRoundBands([0, chartUnits], .08);
		} else {
			me.xScale = d3.scale.ordinal()
				.domain(me.uniqueIds)
				.rangeRoundBands([0, me.canvasWidth - me.margins.left - me.margins.right], .08);
		}
	
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('bottom');
	},

	setYScale: function() {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([0, me.maxValue])
			.range([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);
			
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.tickSize(0)
			.tickPadding(6)
			.tickFormat(me.yTickFormat)
			.orient('left');	
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