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
  	
  	/**5
   	 * "g" elements to hold bars, title, X-axis, and Y-axis
   	 */
   	gCanvas: null,
   	gLayer: null,
   	gTitle: null,
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
    uniqueIds: [],
    stackLayout: null,
    layers: null,
    yMax: null,
    chartTitle: null,
    colorRangeStart: '#000099',
    colorRangeEnd: '#FFCC33',
    
    /**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * yTickFormat
 	 */
 	yTickFormat: function(d) {
 		return Ext.util.Format.number(d, '0,000');
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
 	 * mouse events
 	 */
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
 		// Bring configuration vars into local scope
 		//////////////////////////////////////////////////
 		var svg = me.svg,
 			canvasWidth = me.canvasWidth,
 			canvasHeight = me.canvasHeight,
 			panelId = me.panelId,
 			margins = me.margins,
 			handleEvents = me.handleEvents,
 			eventRelay = me.eventRelay,
 			mouseEvents = me.mouseEvents;
 			
		//////////////////////////////////////////////////
		// initial adjustment of the color scale
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
		// set the max "Y" value
		//////////////////////////////////////////////////
		me.setYMax();
		
		//////////////////////////////////////////////////
		// set X and Y scales, bring into local scope
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		var _xScale = me.xScale,
			 _yScale = me.yScale;
		
		// calculate the totals for each "id" value in the domain
		/*var totals = {};
		me.graphData.forEach(function(category) {
			category.values.forEach(function(item) {
				totals[item.id] = (totals[item.id] || 0) + item.y; // not set yet !!
			})
		});*/
		
		//////////////////////////////////////////////////
		// "gCanvas" element
		//////////////////////////////////////////////////
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
		
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
		// adding rectangles to each layer "g" in "gLayer"
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
		// set the new unique IDs
		//////////////////////////////////////////////////
		me.setUniqueIds();
		me.setYMax();
		me.setXScale();
		me.setYScale();
		
		
		// scales and vars into local scope
		var _xScale = me.xScale,
			 _yScale = me.yScale,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents;
			 
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
			
		// mouse events
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
		// transition the
		//////////////////////////////////////////////////
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
		

		//////////////////////////////////////////////////
		// ADJUST THE REPORT TITLE
		//////////////////////////////////////////////////
		me.gTitle.selectAll('text')
			.text(me.chartTitle);
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
		
		// changing the graph data changes the color scale
		me.colorScale = d3.scale.linear()
		 	.domain([0, data.length - 1])
		 	.range([me.colorRangeStart, me.colorRangeEnd]);
	},
	
	setUniqueIds: function() {
		var me = this;
		
		me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
	},
	
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
	 * @description Set X scale and new X axis definition
	 */
	setXScale: function() {
		var me = this;
		
		me.xScale = d3.scale.ordinal()
			.domain(me.uniqueIds)
			.rangeRoundBands([0, me.canvasWidth - me.margins.left - me.margins.right], .08);
			
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
			.tickFormat(me.yTickFormat)
			.orient('left');	
	},
	
	/**
 	 * @private
 	 */
	setTooltipFunction: function(fn) {
		var me = this;

		me.tooltipFunction = fn;
	},
	
	/**
 	 * @private
 	 */
 	setYTickFormat: function(fn) {
	 	var me = this;
	 	
	 	me.yTickFormat = fn;
	},
	
	/**
 	 * @private
 	 */
 	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	}
});