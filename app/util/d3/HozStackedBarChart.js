/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Horizontal stacked bar chart class
 */
Ext.define('App.util.d3.HozStackedBarChart', {
	
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
   	 * "g" elements to hold bars, title, X-axis, Y-axis, and labels
   	 */
   	gCanvas: null,
   	gLayer: null,
   	gTitle: null,
   	gXAxis: null,
   	gYAxis: null,
   	gLabel: null,
   	
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
    xMax: null,
    chartTitle: null,
    showLabels: false,
    colorRangeStart: '#4682B4',
    colorRangeEnd: '#F4A460',
    barPadding: 5,
    
    /**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * xTickFormat
 	 */
 	xTickFormat: function(d) {
 		return Ext.util.Format.number(d, '0,000');
	},
	
	labelFunction: function(data, index) {
		return 'label';
	},
	labelVAlign: 'middle',
	
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
 	 * @memberOf App.util.d3.HozStackedBarChart
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
 			mouseEvents = me.mouseEvents,
 			barPadding = me.barPadding,
 			colorScale = me.colorScale,
 			labelVAlign = me.labelVAlign;
		 
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
		me.setXMax();
		
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
			.attr('x', function(d) {
				return _xScale(d.y0);
			})
			.attr('width', function(d) {
				return _xScale(d.y0 + d.y) - _xScale(d.y0);
			})
			.attr('y', function(d, i) {
				return _yScale(d.id);
			})
			.attr('height', function(d) {
				return _yScale.rangeBand() - barPadding;
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
					return _xScale(d.y0 + d.y) + Math.floor((_xScale(d.y0) - _xScale(d.y0 + d.y))/2);
				})
				.attr('y', function(d) {
					// _yScale(d.id) is upper left corner of rectangle
					if(labelVAlign == 'bottom') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .9);
					} else if(labelVAlign == 'top') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .1);
					} else {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand()/2);
					}
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
			.attr('class', 'axisBoldAsLove');
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
 	 * @memberOf App.util.d3.HozStackedBarChart
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
		me.setXMax();
		me.setXScale();
		me.setYScale();
		
		
		// scales and vars into local scope
		var _xScale = me.xScale,
			 _yScale = me.yScale,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			barPadding = me.barPadding,
			labelVAlign = me.labelVAlign;
		
		//////////////////////////////////////////////////
		// BAR / LAYER TRANSITIONS
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
					return _xScale(d.y0 + d.y) + Math.floor((_xScale(d.y0) - _xScale(d.y0 + d.y))/2);
				})
				.attr('y', function(d) {
					// _yScale(d.id) is upper left corner of rectangle
					if(labelVAlign == 'bottom') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .85);
					} else if(labelVAlign == 'top') {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand() * .15);
					} else {
						return _yScale(d.id) + Math.floor(_yScale.rangeBand()/2);
					}
				})
				.style('font-family', 'sans-serif')
				.style('font-size', '9px')
				.style('text-anchor', 'middle')
				.text(me.labelFunction);
		} else {
			me.gCanvas.selectAll('.label').data([]).exit().remove()
		}
		
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
			.attr('x', function(d) {
				return _xScale(d.y0);
			})
			.attr('width', function(d) {
				return _xScale(d.y0 + d.y) - _xScale(d.y0);
			})
			.attr('y', function(d, i) {
				return _yScale(d.id);
			})
			.attr('height', function(d) {
				return _yScale.rangeBand() - barPadding;
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
		// TRANSITION AXES
		//////////////////////////////////////////////////
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
		
		//////////////////////////////////////////////////
		// ADJUST THE REPORT TITLE
		//////////////////////////////////////////////////
		me.gTitle.selectAll('text')
			.text(me.chartTitle);
	},
	
	setXScale: function() {
		var me = this;
		
		me.xScale = d3.scale.linear()
			.domain([0, me.xMax])
			.range([0, me.canvasWidth - me.margins.right - me.margins.left]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.tickFormat(me.xTickFormat)
			.orient('bottom');
	},

	setYScale: function() {
		var me = this;
		
		me.yScale = d3.scale.ordinal()
			.domain(me.uniqueIds)
			.rangeRoundBands([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);

		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.tickSize(0)
			.tickPadding(20)
			.orient('left');	
	},
	
	/**
	 *
	 *
	 * SETTERS
	 *
	 *
	 */
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	},
	
	setUniqueIds: function() {
		var me = this;
		
		me.uniqueIds = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
	},
	
	setXMax: function() {
		var me = this;
		
		// max Y value (y0) is the position on the Y scale
		// where a particular rectangle ends
		me.xMax = d3.max(me.layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		}, me);
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		
		me.labelFunction = fn;
	},

	setTooltipFunction: function(fn) {
		var me = this;

		me.tooltipFunction = fn;
	},

 	setXTickFormat: function(fn) {
	 	var me = this;
	 	
	 	me.xTickFormat = fn;
	},
	
 	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	},

 	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	},
	
	setLabelVAlign: function(align) {
		var me = this;
		
		me.labelVAlign = align;
	}
});