/**
 * @class
 * @memberOf Sandbox.util.viz.StackedBarLegendChart
 * @description Stacked bar chart class with legend
 */
Ext.define('Sandbox.util.viz.StackedBarLegendChart', {
	
	/**
 	 * The primary SVG element.  Must be set (after render) outside this class
 	 * and passed as a configuration item
 	 */
 	svg: null,
 	
 	/**
  	 * default canvas width, height
  	 */
  	canvasWidth: 500,
  	canvasHeight: 500,
  	
  	/**
  	 * default color scale
  	 */
  	colorScale: d3.scale.category20(),
  	colorScaleStart: '#039',
  	colorScaleEnd: '#F93',
  	
  	/**
   	 * default Y tick format
   	 * is 0,000
   	 */
  	yTickFormat: function(d) {
	  	return Ext.util.Format.number(d, '0,000');
	},
  	
  	/**
  	 * "g" elements to hold the bars (layers)
  	 * legend, title, X-Axis and Y-axis
   	 */
   	gCanvas: null,
   	gLayer: null,
   	gTitle: null,
	gLegend: null,
   	gXAxis: null,
   	gYAxis: null,
   	
   	/**
     * x and y scales and axes
     */
    xScale: null,
    xAxis: null,
    yScale: null,
    yAxis: null,
    
    /**
     * chart and chart legend default flex values
     */
    chartFlex: 3,
    legendFlex: 1,
    legendSquareWidth: 10,
    legendSquareHeight: 10,
    spaceBetweenChartAndLegend: 20,
    
    /**
     * misc
     */
    graphData: [],
    panelId: null,
    margins: {
    	top: 20,
    	right: 20,
    	bottom: 20,
    	left: 20
    },
    uniqueIds: [],
    stackLayout: null,
    layers: null,
    yMax: null,
    chartTitle: 'REPORT',
    
    /**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
   	
   	constructor: function(config) {
	   	var me = this;
	   	
	   	Ext.apply(me, config);
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.StackedBarChart
 	 * @description Initial drawing
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
 			legendSquareHeight = me.legendSquareHeight;
 			
		// initial adjustment of the color scale
		me.setColorScale(me.colorScaleStart, me.colorScaleEnd);
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
			.call(d3.helper.tooltip().text(me.tooltipFunction));
			
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
 	 * @memberOf Sandbox.util.viz.StackedBarChart
 	 * @description Set the new graphData object
 	 * @param data Object
 	 */
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
		
		me.setColorScale(me.colorScaleStart, me.colorScaleEnd);
	},
	
	/** 
	 * @function
	 */
	setUniqueIds: function() {
		var me = this;
		
		me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
	},
	
	/**
 	 * @function
 	 */
	setYMax: function() {
		var me = this;
		
		// max Y value (y0) is the position on the Y scale
		// where a particular rectangle ends
		me.yMax = d3.max(me.layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		}, me);
	},
	
	/**
	 * @function
	 * @description Set X scale and new X axis definition, adjusted
	 *    by the "flex" the "g" element occupies
	 */
	setXScale: function() {
		var me = this,
			chartUnits = me.getFlexUnit() * me.chartFlex;
		
		me.xScale = d3.scale.ordinal()
			.domain(me.uniqueIds)
			//.rangeRoundBands([0, me.canvasWidth - me.margins.left - me.margins.right], .08);
			.rangeRoundBands([0, chartUnits], .08);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('bottom');
	},
	
	/**
 	 * @function
 	 * @description Set Y scale and new Y axis definition
 	 */
	setYScale: function() {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([0, me.yMax])
			.range([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);
			
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('left')
			.tickFormat(me.yTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.StackedBarChart
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
			legendSquareHeight = me.legendSquareHeight;
			 
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
		
		// call tooltip function
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));	
			
		//////////////////////////////////////////////////
		// transition the
		//////////////////////////////////////////////////
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
		
		//////////////////////////////////////////////////
		// LEGEND SQUARES
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
 	 * @memberOf Sandbox.util.viz.StackedBarLegendChart
 	 * @description Return the width of a flex "unit" (pixels)
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
 	 * @function
 	 * @description Set the tooltip function
 	 * @param metric (hours | dollars)
 	 * @param value (absolute | percent)
 	 * @private
 	 */
 	setTooltipFunction: function(fn) {
	 	var me = this;
	 	
	 	me.tooltipFunction = fn;
 	},
 	
 	/**
 	 * @function
 	 * @description Set the Y axis tick format
 	 * @param fn Function object
  	 * @private
  	 */
 	setYTickFormat: function(fn) {
	 	var me = this;
	 	
	 	me.yTickFormat = fn;
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
 	 * @description Set the report title
 	 * @private
 	 */
 	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	}
});