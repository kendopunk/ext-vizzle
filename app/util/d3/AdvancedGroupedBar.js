/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Advanced grouped bar chart...better grouping
 */
Ext.define('App.util.d3.AdvancedGroupedBar', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,

	chartFlex: 4,
	chartInitialized: false,
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	colorScale: d3.scale.category20c(),
	graphData: [],
	gBar: null,
	gBarLabel: null,
	gGrouper: null,
	gLegend: null,
	gXAxis: null,
	gYAxis: null,
	labelClass: 'labelText',
	legendFlex: 1,
	margins: {
		top: 30,
		right: 10,
		bottom: 50,
		left: 100,
		leftAxis: 90
	},
	marginChange: false,
	opacities: {
		rect: {
			default: .7,
			over: 1
		}
	},
	primaryGrouper: null,
	primaryTickPadding: 10,
	rangePadding: .08,
	rangeOuterPadding: .08,
	secondaryGrouper: null,
	showLegend: true,
	spaceBetweenChartAndLegend: 20,
	
	xAxis: null,
	xScale: null,
	
	yDataMetric: 'value',
	yScale: null,
	
	constructor: function(config) {
		var me = this;
		Ext.merge(me, config);
	},
	
	/**
 	 * initialize chart components
 	 */
	initChart: function() {
		var me = this;
		
		// bar "g"
		me.gBar = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.leftAxis + ', 0)');
	 		
	 	// legend "g"
	 	me.gLegend = me.svg.append('svg:g')
		 	.attr('transform', function() {
		 		var ltx = me.margins.left 
			 		+ (me.getFlexUnit() * me.chartFlex) 
				 	+ me.spaceBetweenChartAndLegend;
			 	return 'translate(' + ltx + ',' + me.margins.top + ')';
		 	
		 	});
		 	
		// grouper "g"
		me.gGrouper = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
	 		
	 	// X axis "g"
		me.gXAxis = me.svg.append('svg:g')
			.attr('class', 'axisMajor')
			.attr('transform', function() {
				var yt = me.canvasHeight - me.margins.bottom;
				return 'translate(' + me.margins.leftAxis + ',' + yt + ')';
			});
		
		// Y axis "g"
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
		
		
		me.chartInitialized = true;

		return me;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Draw/redraw the chart
 	 */
	draw: function() {
		var me = this;

		//////////////////////////////
		// set scales, handle translations
		//////////////////////////////
		me.setXScale();
		me.setYScale();
		me.setYAxisScale();
		me.translateGElements();

		//////////////////////////////
		// handlers
		//////////////////////////////
		me.handleBars();
		me.callAxes();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Handle grouped chart rectangles
 	 */
	handleBars: function() {
		var me = this;
		
		var p = me.getUniquePrimaries();
		var s = me.getUniqueSecondaries();
		var uConfig = Ext.Array.map(p, function(item) {
			return {
				primary: item,
				xs: d3.scale.ordinal()
					.domain(s)
					.rangeRoundBands([
						me.xScale(item),
						me.xScale(item) + me.xScale.rangeBand()
					], me.rangePadding, me.rangeOuterPadding)
			};
		});
		
		////////////////////////////////////////
		// BARS - JRAT
		////////////////////////////////////////
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
			
		rectSelection.exit().remove();
		
		rectSelection.enter()
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.style('opacity', me.opacities.rect.default)
			.style('stroke', 'black')
			.style('stroke-width', .75)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseout', d, i);
			});
			
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				var scaleToUse = Ext.Array.filter(uConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				return scaleToUse(d[me.secondaryGrouper]);
			})
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('y', function(d) {
				return me.canvasHeight - me.yScale(d.value);
			})
			.attr('width', function(d) {
				var scaleToUse = Ext.Array.filter(uConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				return scaleToUse.rangeBand();
			})
			.attr('height', function(d) {
				return me.yScale(d.value) - me.margins.bottom;
			})
			.style('fill', function(d, i) {
				if(me.colorDefinedInData) {
					return d[me.colorDefinedInDataIndex];
				}
				return me.colorScale(i);
			});	
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Set the primary ordinal X scale
 	 */
 	setXScale: function() {
	 	var me = this;
	 	
	 	if(me.showLegend) {
		 	var legendUnits = me.getFlexUnit() * me.legendFlex,
			 	diff = me.canvasWidth - me.margins.left - me.margins.right - legendUnits;
		} else {
			var diff = me.canvasWidth - me.margins.right - me.margins.left;
		}
		
		me.xScale = d3.scale.ordinal()
		 	.domain(me.graphData.map(function(item) {
			 	return item[me.primaryGrouper]
			}))
			.rangeRoundBands([0, diff], me.rangePadding, me.rangeOuterPadding);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(me.primaryTickPadding)
			.orient('bottom');
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Set the Y (value) scale
 	 */
	setYScale: function() {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([
				d3.max(me.graphData, function(d) {
					return d[me.yDataMetric];
				}),
				0
			])
			.range([
				me.canvasHeight - me.margins.top,
				me.margins.bottom
			]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Set the scale for the Y axis (different range)
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		me.yAxisScale = d3.scale.linear()
			.domain([
				0,
				d3.max(me.graphData, function(d) {
					return d[me.yDataMetric];
				})
			])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.canvasHeight - (me.canvasHeight - me.margins.top)
			]);
			
		// figure out the actual Y ticks
		var useYTicks = 10;
		var gdMax = d3.max(me.graphData, function(d) {
			return d[me.yDataMetric];
		});
		if(gdMax < useYTicks) { useYTicks = gdMax; }
		
		me.yAxis = d3.svg.axis()
			.scale(me.yAxisScale)
			.orient('left')
			.ticks(useYTicks)
			.tickFormat(me.yTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Translate relevant "g" elements in the event
 	 * of a change to one or more margin properties
 	 */
	translateGElements: function() {
		var me = this;
		
		if(me.marginChange) {
			me.gBar.transition()
				.duration(750)
				.attr('transform', 'translate(' + me.margins.leftAxis + ', 0)');
			
			me.gGrouper.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
			
			me.gXAxis.attr('transform', function() {
				var yt = me.canvasHeight - me.margins.bottom;
				return 'translate(' + me.margins.leftAxis + ',' + yt + ')';
			});
			
			me.gYAxis.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
			
			me.marginChange = false;
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Call X/Y axes
 	 */
   	callAxes: function() {
	   	var me = this;
	   	
	   	me.gXAxis.transition().duration(500).call(me.xAxis);
	   	me.gYAxis.transition().duration(500).call(me.yAxis);
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
        
        // local scope
        var legendProperty = me.legendProperty;
        
        ////////////////////////////////////////
        // RECT
        ////////////////////////////////////////
        if(elType == 'rect') {
	        var rectSel = d3.select(el);
	        me.mouseEventRect(rectSel, evt);
	        
	      /*  var legendRectSel = me.gLegend.selectAll('rect')
		        .filter(function(e, j) {
			        return d[legendProperty] == e;
			    });
			me.mouseEventLegendRect(legendRectSel, evt);
			
			var legendTextSel = me.gLegend.selectAll('text')
				.filter(function(e, j) {
					return d[legendProperty] == e;
				});
			me.mouseEventLegendText(legendTextSel, evt);*/
        }
        
		/*////////////////////////////////////////
        // LEGEND RECT
        ////////////////////////////////////////
        if(elType == 'legendRect') {
	        var rectSel = me.gBar.selectAll('rect')
		        .filter(function(e, j) {
			        return d == e[legendProperty];
			    });
			me.mouseEventRect(rectSel, evt);
	        
	        var legendRectSel = d3.select(el);
			me.mouseEventLegendRect(legendRectSel, evt);
			
			var legendTextSel = me.gLegend.selectAll('text')
				.filter(function(e, j) {
					return d == e;
				});
			me.mouseEventLegendText(legendTextSel, evt);
        }
        
        ////////////////////////////////////////
        // LEGEND TEXT
        ////////////////////////////////////////
        if(elType == 'legendText') {
	        var rectSel = me.gBar.selectAll('rect')
		        .filter(function(e, j) {
			        return d == e[legendProperty];
			    });
			me.mouseEventRect(rectSel, evt);
	        
	        var legendRectSel = me.gLegend.selectAll('rect')
		        .filter(function(e, j) {
			        return d == e;
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
        }*/
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
			    .style('stroke', '#555555')
			    .style('stroke-width', 1);
	    }
	    if(evt == 'mouseout') {
	    	selection.style('opacity', me.opacities.rect.default)
			    .style('stroke', 'none');
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
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Calculate the width of one "flex" unit
 	 */
 	getFlexUnit: function() {
	 	var me = this;
	 	
	 	var workingWidth = me.canvasWidth - me.margins.left - me.margins.right;
	 	
	 	return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	},
 	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Get a sorted array of "primaryGrouper" values
 	 */
 	getUniquePrimaries: function() {
 		var me = this;
 		
 		return Ext.Array.unique(Ext.Array.sort(
 			Ext.Array.pluck(me.graphData, me.primaryGrouper)
		));
 	},
 	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Get a sorted array of "secondaryGrouper" values
 	 */
 	getUniqueSecondaries: function() {
 		var me = this;
 		
 		return Ext.Array.unique(Ext.Array.sort(
 			Ext.Array.pluck(me.graphData, me.secondaryGrouper)
		));
 	},
 	
 	/**
  	 *
  	 * SETTERS
  	 *
  	 */
  	setGraphData: function(d) {
	  	var me = this;
	  	me.graphData = d;
	  	return me;
	},

 	setMarginProperty: function(property, value) {
 		var me = this;
 		me.margins[property] = value;
 		me.marginChange = true;
 	},
 	
 	setPrimaryGrouper: function(g) {
	  	var me = this;
	  	me.primaryGrouper = g;
	},
	
	setPrimaryTickPadding: function(tp) {
		var me = this;
		me.primaryTickPadding = tp;
	},
	
	setRangePadding: function(p) {
		var me = this;
		if(!isNaN(p) || p<0 || p>1) { return; }
		me.rangePadding = p;
	},
	
	setRangeOuterPadding: function(p) {
		var me = this;
		if(!isNaN(p) || p<0 || p>1) { return; }
		me.rangeOuterPadding = p;
	},
	
	setSecondaryGrouper: function(g) {
		var me = this;
		me.secondaryGrouper = g;
	},
	
	setShowLegend: function(bool) {
		var me = this;
		me.showLegend = bool;
	}
});