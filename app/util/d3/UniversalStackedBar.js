/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Stacked bar chart class
 */
Ext.define('App.util.d3.UniversalStackedBar', {
	
	/**
 	 * The primary SVG element.  Must be set (after render) outside this class
 	 * and passed as a configuration item
 	 */
 	svg: null,
 	
	// other configs
  	barPadding: 5,
  	canvasHeight: 500,
  	canvasWidth: 500,
  	chartFlex: 3,
  	chartInitialized: false,
  	chartOrientation: 'vertical',
  	chartTitle: null,
  	colorPalette: 'default',
  	colorRangeStart: null,
  	colorRangeEnd: null,
  	colorScale: d3.scale.category10(),
  	eventRelay: null,
  	
  	// "g" elements
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
   	legendClass: 'legendText',
	legendBoldClass: 'legendTextBold',
	legendOverClass: 'legendTextBoldOver',
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
		mouseout: {
			enabled: false,
			eventName: null,
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
	opacities: {
		rect: {
			default: .65,
			over: 1
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
	
	// x
    xAxis: null,
    xScale: null,
    xTickFormat: function(d) {
 		return Ext.util.Format.number(d, '0,000');
	},
	
	// y
    yAxis: null,
    yScale: null,
    yTicks: 10,
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
	 * @description Initialize chart components
	 */
	initChart: function() {
		var me = this;
		
		////////////////////////////////////////
		// "g" elements
		////////////////////////////////////////
		// canvas
		me.gCanvas = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ', ' + me.margins.top + ')');
		
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
			.attr('transform', 'translate(' + legendTranslateX + ', ' +  me.margins.top + ')');
		
		// x
		var gAxTranslate = me.canvasHeight - me.margins.top - me.margins.bottom;
		me.gXAxis = me.gCanvas.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + gAxTranslate + ')');
		
		// y
		me.gYAxis = me.gCanvas.append('svg:g').attr('class', 'axis');	
			
		me.chartInitialized = true;
		
		return me;
	},

	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalStackedBar
 	 * @description Initial drawing
 	 */
 	draw: function() {
 		var me = this;
 		
 		//////////////////////////////////////////////////
 		// color scale
		//////////////////////////////////////////////////
		me.setColorScale();
		
		//////////////////////////////////////////////////
		// get the array of unique "id" properties
		//////////////////////////////////////////////////
		me.setUniqueIds();
		
		//////////////////////////////////////////////////
		// build the layers
		//////////////////////////////////////////////////
		me.buildLayers();
		
		//////////////////////////////////////////////////
		// set X/Y scales...
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		
		//////////////////////////////////////////////////
		// HANDLERS
		// - layers
		//////////////////////////////////////////////////
		me.handleBars();
		me.handleLabels();
		me.handleLegend();
		me.handleChartTitle();
		me.callAxes();
	},
	
	/**
 	 * @function
 	 * @description Configure elements used for layer/stack calculations
 	 */
	buildLayers: function() {
		var me = this;
		
		var colorScale = me.colorScale;
		
		// stack layout function
		me.stackLayout = d3.layout.stack().values(function(d) {
			return d.values;
		});
		
		// calculate layers
		me.layers = me.stackLayout(me.graphData);
		
		// get max value from data set
		me.setMaxValue();
		
		////////////////////////////////////////
		// LAYER - JRAT
		////////////////////////////////////////
		me.gLayer = me.gCanvas.selectAll('.layer')
			.data(me.layers);
		
		me.gLayer.exit().remove();
		
		me.gLayer.enter()
			.append('g')
			.attr('class', 'layer');
			
		me.gLayer.transition()
			.style('fill', function(d, i) {
				return colorScale(i);
			});
			
		return;
	},
	
	/**
 	 * @function
 	 * @description Handle drawing/regenerating bars in layers
 	 */
	handleBars: function() {
		var me = this;
		
		// local scope
		var barPadding = me.barPadding,
			chort = me.chartOrientation,
			xScale = me.xScale,
			yScale = me.yScale;
		
		//////////////////////////////////////////////////
		// RECTANGLE - JRAT
		//////////////////////////////////////////////////
		var rectSelection = me.gLayer.selectAll('rect')
			.data(function(d) {
				return d.values;
			});
			
		rectSelection.exit()
			.transition()
			.attr('width', 0)
			.duration(500)
			.remove();
			
		rectSelection.enter()
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.style('opacity', me.opacities.rect.default)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseout', d, i);
			});
			
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				if(chort == 'horizontal') {
					return xScale(d.y0);
				} else {	
					return xScale(d.id);
				}
			})
			.attr('width', function(d) {
				if(chort == 'horizontal') {
					return xScale(d.y0 + d.y) - xScale(d.y0);
				} else {
					return xScale.rangeBand();
				}
			})
			.attr('y', function(d) {
				if(chort == 'horizontal') {
					return yScale(d.id);
				} else {
					return yScale(d.y0 + d.y);
				}
			})
			.attr('height', function(d) {
				if(chort == 'horizontal') {
					return yScale.rangeBand() - barPadding;
				} else {
					return yScale(d.y0) - yScale(d.y0 + d.y);
				}
			});
			
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		return;
	},
	
	callAxes: function() {
		var me = this;
		
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
	},
 	
	/**
	 * @function
	 * @description Handle the bar chart labels
	 */
	handleLabels: function() {
		var me = this;
		
		if(!me.showLabels) {
			me.gCanvas.selectAll('.label')
				.transition()
				.duration(250)
				.attr('x', -100)
				.remove();
		
			return;
		}
		
		// local scope
		var chort = me.chartOrientation,
			labelVAlign = me.labelVAlign,
			xScale = me.xScale,
			yScale = me.yScale;
		
		////////////////////////////////////////
		// LABEL - JRAT
		////////////////////////////////////////
		me.gLabel = me.gCanvas.selectAll('.label')
			.data(me.layers);
			
		me.gLabel.exit().remove();
		
		var addedLabels = me.gLabel.enter()
			.append('g')
			.attr('class', 'label');
				
		var textSelection = me.gLabel.selectAll('text')
			.data(function(d) {
				return d.values;
			});
			
		textSelection.exit()
			.transition()
			.attr('x', 1000)
			.duration(500)
			.remove();
				
		textSelection.enter()
			.append('text')
			.style('opacity', 0);
			
		// transition all
		textSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				if(chort == 'horizontal') {
					return xScale(d.y0 + d.y) + Math.floor((xScale(d.y0) - xScale(d.y0 + d.y))/2);
				} else {
					// scaled X position + (rectWidth / 2)
					return xScale(d.id) + Math.floor(xScale.rangeBand()/2);
				}
			})
			.attr('y', function(d) {
				if(chort == 'horizontal') {
					// yScale(d.id) is upper left corner of rectangle
					if(labelVAlign == 'bottom') {
						return yScale(d.id) + Math.floor(yScale.rangeBand() * .85);
					} else if(labelVAlign == 'top') {
						return yScale(d.id) + Math.floor(yScale.rangeBand() * .15);
					} else {
						return yScale(d.id) + Math.floor(yScale.rangeBand()/2);
					}
				} else {
					if(labelVAlign == 'bottom') {
						return yScale(d.y0 + d.y) + Math.floor((yScale(d.y0) - yScale(d.y0 + d.y)) * .9);
					} else if(labelVAlign == 'top') {
						return yScale(d.y0 + d.y) + Math.floor((yScale(d.y0) - yScale(d.y0 + d.y)) * .1);
					} else {
						return yScale(d.y0 + d.y) + Math.floor((yScale(d.y0) - yScale(d.y0 + d.y))/2);
					}
				}
			})
			.attr('class', 'labelText')
			.style('text-anchor', 'middle')
			.text(me.labelFunction)
			.each('end', function(d, i) {
				if(chort == 'horizontal') {
					var calculatedRectWidth = xScale(d.y0 + d.y) - xScale(d.y0);
					var computedTextLength = d3.select(this).node().getComputedTextLength();
					
					d3.select(this)
						.transition()
						.style('opacity', function(dd) {
						 	return computedTextLength >= calculatedRectWidth ? 0 : 1;
						});
				} else {
					var calculatedRectHeight = yScale(d.y0) - yScale(d.y0 + d.y);
					
					d3.select(this)
						.transition()
						.style('opacity', function(dd) {
							return calculatedRectHeight < 20 ? 0 : 1;
						});
				}
			});
	},
	
	/**
 	 * @function
 	 * @description Handle the legend
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
	 	var legendSquareHeight = me.legendSquareHeight,
	 		legendSquareWidth = me.legendSquareWidth,
	 		colorScale = me.colorScale,
	 		gCanvas = me.gCanvas;
	 		
	 	////////////////////////////////////////
	 	// LEGEND RECTANGLES - JRAT
	 	////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
		 	.data(me.graphData);
		 	
		legendSquareSelection.exit().remove();
		
		legendSquareSelection.enter().append('rect')
			.style('opacity', me.opacities.rect.default)
			.style('stroke', 'none')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseout', d, i);
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
	 	// LEGEND TEXT - JRAT
	 	////////////////////////////////////////
	 	var legendTextSelection = me.gLegend.selectAll('text')
		 	.data(me.graphData);
		
		legendTextSelection.exit().remove();

		legendTextSelection.enter()
			.append('text')
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseout', d, i);
			});

		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.attr('class', me.legendClass)
			.text(function(d) {
				return d.category.toUpperCase();
			});
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
	
	/**
 	 * @function
 	 */
	setXScale: function() {
		var me = this;
		
		var chartUnits = me.getFlexUnit() * me.chartFlex,
			legendUnits = me.getFlexUnit() * me.legendFlex;
			
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
				.tickPadding(6)
				.tickFormat(me.xTickFormat)
				.ticks(Ext.Array.min([me.yTicks, me.maxValue]))
				.orient('bottom');
		} else {
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
				.tickPadding(6)
				.orient('bottom');
		}
	},
	
	/**
 	 * @function
 	 */
	setYScale: function() {
		var me = this;
		
		if(me.chartOrientation == 'horizontal') {
			me.yScale = d3.scale.ordinal()
				.domain(me.uniqueIds)
				.rangeRoundBands([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);

			me.yAxis = d3.svg.axis()
				.scale(me.yScale)
				.tickPadding(20)
				.orient('left');	
		} else {
			me.yScale = d3.scale.linear()
				.domain([0, me.maxValue])
				.range([me.canvasHeight - me.margins.top - me.margins.bottom, 0]);
				
			me.yAxis = d3.svg.axis()
				.scale(me.yScale)
				.tickPadding(6)
				.ticks(Ext.Array.min([me.yTicks, me.maxValue]))
				.tickFormat(me.yTickFormat)
				.orient('left');
		}
	},
	
	/**
     * @function
     * @description Publish a mouse event with the event relay
     * @param el Element
     * @param elType String
     * @param evt String mouseover|mouseout|etc..
     * @param d Object Data object
     * @param i Integer index
     */
    handleMouseEvent: function(el, elType, evt, d, i) {
        var me = this;
        
        /////////////////////////////////
        // RECT
        /////////////////////////////////
        if(elType == 'rect') {
	        var rectSel = d3.select(el);
	        me.mouseEventRect(rectSel, evt);
	        
	        var legendRectSel = me.gLegend.selectAll('rect')
	        	.filter(function(e, j) {
		        	return d.category == e.category;
		        });
		    me.mouseEventLegendRect(legendRectSel, evt);
		        
		    var legendTextSel = me.gLegend.selectAll('text')
		    	.filter(function(e, j) {
			    	return d.category == e.category;
			    });
			me.mouseEventLegendText(legendTextSel, evt);
        }
        
        /////////////////////////////////
        // LEGEND RECT
        /////////////////////////////////
        if(elType == 'legendRect') {
	        var rectSel = me.gCanvas.selectAll('.layer')
		        .filter(function(e, j) {
			        return i == j;
			    })
			    .selectAll('rect');
	        me.mouseEventRect(rectSel, evt);
	        
	        var legendRectSel = d3.select(el);
		    me.mouseEventLegendRect(legendRectSel, evt);
		        
		    var legendTextSel = me.gLegend.selectAll('text')
		    	.filter(function(e, j) {
			    	return d.category == e.category;
			    });
			me.mouseEventLegendText(legendTextSel, evt);
        }
        
        /////////////////////////////////
        // LEGEND TEXT
        /////////////////////////////////
        if(elType == 'legendText') {
	        var rectSel = me.gCanvas.selectAll('.layer')
		        .filter(function(e, j) {
			        return i == j;
			    })
			    .selectAll('rect');
	        me.mouseEventRect(rectSel, evt);
	        
	        var legendRectSel = me.gLegend.selectAll('rect')
		    	.filter(function(e, j) {
			    	return d.category == e.category;
			    });
			me.mouseEventLegendRect(legendRectSel, evt);
			
			var legendTextSel = d3.select(el);
			me.mouseEventLegendText(legendTextSel, evt);
        }
        
        // message bus
        if(me.handleEvents && me.eventRelay && me.mouseEvents[evt].enabled) {
            me.eventRelay.publish(me.mouseEvents[evt].eventName, {
                payload: d,
                index: i
            });
        }
    },
    
    mouseEventRect: function(selection, evt) {
	    var me = this;
	    
	    if(evt == 'mouseover') {
		    selection.style('opacity', me.opacities.rect.over);
		}
		if(evt == 'mouseout') {
			selection.style('opacity', me.opacities.rect.default);
		}
    },
    
    mouseEventLegendRect: function(selection, evt) {
    	var me = this;
    	
    	if(evt == 'mouseover') {
	    	selection.style('opacity', me.opacities.rect.over)
		    	.style('stroke', 'black')
		    	.style('stroke-width', 1);
    	}
    	if(evt == 'mouseout') {
    		selection.style('opacity', me.opacities.rect.default)
		    	.style('stroke', 'none')
		    	.style('stroke-width', 1);
    	}
    },
    
    mouseEventLegendText: function(selection, evt) {
	    var me = this;
	    
	 	if(evt == 'mouseover') {
	    	selection.attr('class', me.legendBoldClass)
		    	.style('font-weight', 'bold')
		    	.style('fill', '#990066');
    	}
    	if(evt == 'mouseout') {
    		selection.attr('class', me.legendClass)
		    	.style('font-weight', 'normal')
		    	.style('fill', 'black');
    	}
	},

	/**
	 *
	 * PROPERTY SETTERS
	 *
	 */
	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	},
	
	setColorPalette: function(p) {
		var me = this;	
		me.colorPalette = p;
	},
	
	setColorScale: function() {
		var me = this;
		
		if(me.colorPalette == 'custom') {
			return me.colorScale;
		}
		else if(me.colorPalette == 'gradient_blue') {
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
	
	setGraphData: function(data) {
		var me = this;
		me.graphData = data;
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		me.labelFunction = fn;
	},
	
	setLabelVAlign: function(align) {
		var me = this;
		me.labelVAlign = align;
	},
	
	setOrientation: function(ort) {
		var me = this;
		me.chartOrientation = ort;
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