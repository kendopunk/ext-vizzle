/**
 * @class
 * @memberOf App.util.d3
 * @description Stacked bar chart class
 */
Ext.define('App.util.d3.StackedBarChart', {
	
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
  	
  	/**
   	 * "g" elements to hold bars, X-axis, and Y-axis
   	 */
   	gCanvas: null,
   	gLayer: null,
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
    uniqueCategories: [],
    uniqueIds: [],
    stackLayout: null,
    layers: null,
    yMax: null,
   	
   	constructor: function(config) {
	   	var me = this;
	   	
	   	Ext.apply(me, config);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.StackedBarChart
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
 			margins = me.margins;
 			
		// adjust the color scale
		var colorScale = me.colorScale = d3.scale.linear()
		 	.domain([0, me.graphData.length - 1])
		 	.range(['#f00', '#00f']);
		 	
		var _uniqueCategories = me.uniqueCategories = me.graphData.map(function(item) {
			return item.key;
		});
		
		// get the array of unique "id" properties
	 	me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
 			
 		// set the stack layout
 		me.stackLayout = d3.layout.stack().values(function(d) {
			return d.values;
		});
		
		// apply the stack function to layers variable
		me.layers = me.stackLayout(me.graphData);
		
		// max Y value (y0) is the position on the Y scale
		// where a particular rectangle ends
		me.yMax = d3.max(me.layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		});
		
		// calculate the totals for each "id" value in the domain
		var totals = {};
		me.graphData.forEach(function(category) {
			category.values.forEach(function(item) {
				totals[item.id] = (totals[item.id] || 0) + item.y; // not set yet !!
			})
		});
		
		// set up the X scale
		var _xScale = me.xScale = d3.scale.ordinal()
			.domain(me.uniqueIds)
			.rangeRoundBands([0, canvasWidth - margins.left - margins.right], .08);
			
		// set up the X axis function
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('bottom');
			
		// set up the Y scale
		var _yScale = me.yScale = d3.scale.linear()
			.domain([0, me.yMax])
			.range([canvasHeight - margins.top - margins.bottom, 0]);
			
		// set up the Y axis function
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.tickSize(0)
			.tickPadding(6)
			.orient('left');
			
		// "gCanvas" element
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
			
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
			.attr('fill-opacity', .5)
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
			});
			
		// adding the text to "gLayer"
		/*me.gLayer.selectAll('text')
			.data(me.uniqueIds)
			.enter()
			.append('text')
			.text(function(d) {
				return d;
				// return d + ': ' + totals[d];
			})
			.attr('fill', '#000')
			.style('font-size', 10)
			.attr('x', function(d) {
				return _xScale(d) + 25;
			})
			.attr('y', function(d) {
				return _yScale(d) + 40;
			});
		*/
		
		// X axis
		var g_ax_translate = canvasHeight - margins.top - margins.bottom;
		me.gXAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + g_ax_translate + ')');
			
		me.gXAxis.call(me.xAxis);
		
		// Y axis
		me.gYAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis');
			
		me.gYAxis.call(me.yAxis);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.StackedBarChart
 	 * @description Transition stacked bar chart layout with new data
 	 */
	transition: function() {
		var me = this;
		
		var margins = me.margins,
			canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight;
		
		
		
		var layers = me.stackLayout(me.graphData);
		
		me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
		
		me.yMax = d3.max(layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		});
		
		console.log(me.yMax);
		
		var xs = d3.scale.ordinal()
			.domain(me.uniqueIds)
			.rangeRoundBands([0, canvasWidth - margins.left - margins.right], .08);
			
		var ys = d3.scale.linear()
			.domain([0, me.yMax])
			.range([canvasHeight - margins.top - margins.bottom, 0]);

		
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(layers);
		
		console.debug(me.gLayer);
		
		// OK...I'm joining now
		var temp = me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			});
			
		temp.exit().transition().attr('width', 0).duration(500).remove();
		
		var added = temp
			.enter()
			.append('rect')
			.attr('fill-opacity', .5)
			.attr('stroke', 'black')
			.style('stroke-width', 0.5)
			.attr('width', xs.rangeBand())
			.attr('x', function(d) {
				return xs(d.id);
			})
			.attr('y', function(d) {
				return ys(d.y0 + d.y);
			})
			.attr('height', function(d) {
				return ys(d.y0) - ys(d.y0 + d.y);
			});
			
			
		temp.transition().duration(500).attr('width', xs.rangeBand())
			.attr('x', function(d) {
				return xs(d.id);
			})
			.attr('y', function(d) {
				return ys(d.y0 + d.y);
			})
			.attr('height', function(d) {
				return ys(d.y0) - ys(d.y0 + d.y);
			});
			
		//temp.exit().transition().attr('width', 0).duration(500).remove();
		
		// transition them all
		
		//temp.transition().duration(100).attr('x', 100);
		
		//temp.transition().duration(100).attr('height', 20);
		
		/*temp
			.enter()
			.append('rect')
			.attr('fill-opacity', .5)
			.attr('stroke', 'black')
			.style('stroke-width', 0.5)
			.attr('width', xs.rangeBand())
			.attr('x', function(d) {
				return xs(d.id);
			})
			.attr('y', function(d) {
				return ys(d.y0 + d.y);
			})
			.attr('height', function(d) {
				//return ys(d.y0) - ys(d.y0 + d.y);
				return 20;
			});
			*/
	
	
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.StackedBarChart
 	 * @description Set the new graphData object
 	 * @param data Object
 	 */
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	}
});