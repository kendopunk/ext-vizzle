/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Stacked bar chart class with legend
 * @extend App.util.d3.StackedBarChart
 */
Ext.define('App.util.d3.StackedBarLegendChart', {
	extend: 'App.util.d3.StackedBarChart',
	
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
  	legendFontSize: 10,
  	
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
	 * @memberOf App.util.d3.StackedBarLegendChart
	 * @override
	 */
	draw: function() {
 		var me = this;
 		
 		//
 		// Bring configuration vars into local scope
 		// for use in D3 functions
 		//
 		var svg = me.svg,
 			canvasWidth = me.canvasWidth,
 			canvasHeight = me.canvasHeight,
 			panelId = me.panelId,
 			margins = me.margins,
 			legendSquareWidth = me.legendSquareWidth,
 			legendSquareHeight = me.legendSquareHeight,
 			handleEvents = me.handleEvents,
 			eventRelay = me.eventRelay,
 			mouseEvents = me.mouseEvents;
 			
		// initial adjustment of the color scale
		me.setColorScale(me.colorRangeStart, me.colorRangeEnd);
		colorScale = me.colorScale;
		 	
		// get the array of unique "id" properties
		me.setUniqueIds();
		
		// set the stack layout
		me.stackLayout = d3.layout.stack().values(function(d) {
			return d.values;
		});
		
		// apply the stack function to layers variable
		me.layers = me.stackLayout(me.graphData);
		
		// set the max "Y" value
		me.setYMax();
		
		// set X and Y scales, bring into local scope
		me.setXScale();
		me.setYScale();
		var _xScale = me.xScale,
			 _yScale = me.yScale;
			
		// "gCanvas" element
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
			
		// "gLegend" element, translate based on 
		// the space the chart occupies including the padding
		// translate down the Y axis a bit
		var legendTranslateX = me.margins.left + 
			(me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' +  margins.top + ')');
		
		//////////////////////////////////////////////////
		// rectangles
		//////////////////////////////////////////////////	
		// "gLayer" element
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers)
			.enter()
			.append('g')
			.attr('class', 'layer')
			.style('fill', function(d, i) {
				return colorScale(i);
			});
		
		// adding rectangles to each layer "g" in "gLayer"
		me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			})
			.enter()
			.append('rect')
			.attr('fill-opacity', .7)
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
		// LEGEND RECTANGLES
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
			});
		
		//////////////////////////////////////////////////
		// LEGEND TEXT
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
			.style('font-size', me.legendFontSize)
			.text(function(d) {
				return d.category.toUpperCase();
			});
			
		//////////////////////////////////////////////////
		// TITLE
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15, ' + parseInt(me.margins.top/2) + ')');
		
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
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.StackedBarChart
 	 * @description Transition stacked bar chart layout with new data
 	 */
	transition: function() {
		var me = this;
		
		// set new layers
		me.layers = me.stackLayout(me.graphData);
		
		// set the new unique IDs
		me.setUniqueIds();
		me.setYMax();
		me.setXScale();
		me.setYScale();
		
		// scales and vars into local scope
		var _xScale = me.xScale,
			 _yScale = me.yScale,
			colorScale = me.colorScale,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents;
			
		//////////////////////////////////////////////////
		// TRANSITION THE LAYERS
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
			.attr('fill-opacity', .7)
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
		// TRANSITION LEGEND SQUARES
		//////////////////////////////////////////////////
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
			
		//////////////////////////////////////////////////
		// TRANSITION LEGEND TEXT
		//////////////////////////////////////////////////
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
			
		//////////////////////////////////////////////////
		// ADJUST THE REPORT TITLE
		//////////////////////////////////////////////////
		me.gTitle.selectAll('text')
			.text(me.chartTitle);
	},
	
	/**
 	 * @function
 	 * @description Set the color scale start value
 	 * @private
 	 */
 	setColorScale: function(startColor, endColor) {
	 	var me = this;
	 	
	 	me.colorScale = d3.scale.linear()
		 	.domain([0, me.graphData.length - 1])
		 	.range([startColor, endColor]);
	},
	
	/**
	 * @function
	 * @override
	 * @description Set X scale and new X axis definition
	 */
	setXScale: function() {
		
		var me = this;
		var chartUnits = me.getFlexUnit() * me.chartFlex;
		
		me.xScale = d3.scale.ordinal()
			.domain(me.uniqueIds)
			.rangeRoundBands([0, chartUnits], .08);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('bottom');
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