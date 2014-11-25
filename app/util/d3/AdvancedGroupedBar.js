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
	gGrouper: null,
	gLegend: null,
	gXAxis: null,
	gYAxis: null,
	labelClass: 'labelText',
	labelFunction: function(d, i) {
		return 'label';
	},
	legendClass: 'legendText',
	legendBoldClass: 'legendTextBold',
	legendFlex: 1,
	legendSquareWidth: 10,
	legendSquareHeight: 10,
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
			over: 1,
			excluded: .3
		}
	},
	primaryGrouper: null,
	primaryTickPadding: 10,
	rangePadding: .1,
	rangeOuterPadding: .1,
	secondaryGrouper: null,
	showBarLabels: true,
	showLegend: true,
	spaceBetweenChartAndLegend: 20,
	tooltipFunction: function(d, i) {
		return 'tooltip';
	},
	
	xAxis: null,
	xScale: null,
	
	yDataMetric: 'value',
	yScale: null,
	yTickFormat: function(d) { return d; },
	
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
			.attr('id', 'pugga')
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
		me.handleLegend();
		me.handleBarLabels();
		
		//////////////////////////////
		// axes / groupers
		//////////////////////////////
		me.callAxes();
		me.triggerPrimaryGroupers();
		me.triggerSecondaryGroupers();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Handle grouped chart rectangles
 	 */
	handleBars: function() {
		var me = this;
		
		////////////////////////////////////////
		// primary grouper configuration
		////////////////////////////////////////
		var primaryGrouperConfig = me.buildPrimaryGrouperConfig();

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
				// this rectangle
				me.handleMouseEvent(this, 'rect', 'mouseover', d, i);
				
				// rects not selected...opacity reduction
				/*me.gBar.selectAll('rect').filter(function(e, j) {
					return i != j;
				})
				.style('opacity', me.opacities.rect.excluded);*/
			})
			.on('mouseout', function(d, i) {
				// this rectangle
				me.handleMouseEvent(this, 'rect', 'mouseout', d, i);
				
				// rects not selected...opacity reduction
				/*me.gBar.selectAll('rect').filter(function(e, j) {
					return i != j;
				})
				.style('opacity', me.opacities.rect.default);*/
			});
			
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				var scaleToUse = Ext.Array.filter(primaryGrouperConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				var xPos = scaleToUse(d.id);
				d.xPos = xPos;		// stash
				return xPos;
			})
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('y', function(d) {
				return me.canvasHeight - me.yScale(d[me.yDataMetric]);
			})
			.attr('width', function(d) {
				var scaleToUse = Ext.Array.filter(primaryGrouperConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				var bWidth = scaleToUse.rangeBand();
				d.bWidth = bWidth;	// stash
				return bWidth;
			})
			.attr('height', function(d) {
				return me.yScale(d[me.yDataMetric]) - me.margins.bottom;
			})
			.style('fill', function(d, i) {
				if(me.colorDefinedInData) {
					return d[me.colorDefinedInDataIndex];
				}
				return me.colorScale(i);
			});
		
		// apply tooltips
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	/**
  	 * @function
  	 * @description Handle bar labels
  	 */
  	handleBarLabels: function() {
  		var me = this;
  		
  		if(!me.showBarLabels) {
	  		me.gBar.selectAll('text')
	  			.transition()
	  			.duration(250)
	  			.style('opacity', .1)
	  			.remove();
	  		
	  		return;
	  	}
	  	
	  	////////////////////////////////////////
		// primary grouper configuration
		////////////////////////////////////////
		var primaryGrouperConfig = me.buildPrimaryGrouperConfig();
	  	
	  	////////////////////////////////////////
	  	// BAR LABEL - JRAT
	  	////////////////////////////////////////
		var labelSelection = me.gBar.selectAll('text')
			.data(me.graphData);
			
		labelSelection.exit().remove();
	  	
	  	labelSelection.enter()
	  		.append('text')
	  		.attr('class', 'labelText')
	  		.style('text-anchor', 'start')
	  		.style('opacity', 0);
	  		
	  	labelSelection.transition()
		  	.duration(500)
		  	.attr('x', function(d, i) {
				var scaleToUse = Ext.Array.filter(primaryGrouperConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				return scaleToUse(d.id) + (d.bWidth/2);	// stashed
			})
			.attr('y', function(d) {
				// 10 px up from margins.bottom
				return me.canvasHeight - me.margins.bottom - 10;
			})
			.attr('transform', function(d) {
				// rotation needs to happen around the text's X and Y position
				
				var scaleToUse = Ext.Array.filter(primaryGrouperConfig, function(conf) {
					return d[me.primaryGrouper] == conf.primary;
				})[0].xs;
				
				var x = scaleToUse(d.id) + (d.bWidth/2);
				var y = me.canvasHeight - me.margins.bottom - 10;
				
				return 'rotate(-90,' + x + ',' + y + ')';
			})
			.style('opacity', 1)
			.text(me.labelFunction);
			
		return;
  	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Draw/redraw the legend
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
		
		//////////////////////////////
		// get unique data for legend
		//////////////////////////////
		var legendData = [], foundKeys = [];
		Ext.each(me.graphData, function(item) {
			if(foundKeys.indexOf(item[me.tertiaryGrouper]) < 0) {
				foundKeys.push(item[me.tertiaryGrouper]);
				legendData.push({
					name: item[me.tertiaryGrouper],
					color: item.color
				});
			}
		}, me);
		
		////////////////////////////////////////
		// LEGEND SQUARES - JRAT
		////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
			.data(legendData.sort(function(a, b) {
				return a.name > b.name ? 1 : -1;
			}));
				
		legendSquareSelection.exit().remove();
			
		legendSquareSelection.enter().append('rect')
			.style('opacity', me.opacities.rect.default)
			.style('stroke', 'black')
			.style('stroke-width', .75)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseout', d, i);
			});
		
		legendSquareSelection.transition()
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * me.legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.style('fill', function(d, i) {
				return d[me.colorDefinedInDataIndex];
			});
		
		////////////////////////////////////////
		// LEGEND TEXT - JRAT
		////////////////////////////////////////
		var legendTextSelection = me.gLegend.selectAll('text')
			.data(legendData.sort(function(a, b) {
				return a.name > b.name ? 1 : -1;
			}));
				
		legendTextSelection.exit().remove();
			
		legendTextSelection.enter().append('text')
			.style('cursor', 'default')
			.attr('class', me.legendClass)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseout', d, i);
			});
		
		legendTextSelection.transition()
			.attr('x', me.legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * me.legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + me.legendSquareHeight + ')')
			.text(function(d) { return d.name; });
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Draw/redraw the primary groupers
 	 */
	triggerPrimaryGroupers: function() {
		var me = this;
		
		var r = me.xScale.range(), 
			rb = me.xScale.rangeBand();
				
		////////////////////////////////
		// GROUPER - JRAT
		////////////////////////////////
		var textSelection = me.gGrouper.selectAll('text.primaryGrouper')
			.data(me.getUniqueProperty(me.primaryGrouper));
			
		textSelection.exit()
			.transition()
			.duration(750)
			.style('opacity', -1e6)
			.remove();
			
		textSelection.enter()
			.append('text')
			.attr('class', 'primaryGrouper')
			.style('text-anchor', 'middle')
			.style('opacity', 0);
			
		textSelection.transition()
			.duration(750)
			.style('opacity', 1)
			.attr('x', function(d, i) {
				return r[i] + (rb/2);
			})
			.attr('y', me.canvasHeight - me.margins.bottomText)
			.text(String);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Draw/redraw the secondary groupers
 	 */
	triggerSecondaryGroupers: function() {
		var me = this;
		
		var r = me.xScale.range(), 
			rb = me.xScale.rangeBand(),
			p = me.getUniqueProperty(me.primaryGrouper),
			s = me.getUniqueProperty(me.secondaryGrouper),
			t = me.getUniqueProperty(me.tertiaryGrouper);
			
		// product of s * t
		var sLen = s.length,
			tLen = t.length,
			sxt = sLen * tLen;
		
		////////////////////////////////
		// GROUPER - JRAT
		////////////////////////////////
		var textSelection = me.gGrouper.selectAll('text.secondaryGrouper')
			.data(me.graphData);
			
		textSelection.exit()
			.transition()
			.duration(750)
			.style('opacity', -1e6)
			.remove();
			
		textSelection.enter()
			.append('text')
			.attr('class', 'secondaryGrouper')
			.style('text-anchor', 'middle')
			.style('opacity', 0);
			
		textSelection.transition()
			.duration(750)
			.style('opacity', function(d, i) {
				if(tLen == 1) { return 1; }
				return i%tLen == 0 ? 1 : 0;
			})
			.attr('x', function(d, i) {
				// only 1 tertiary grouper?
				if(tLen == 1) {
					return d.xPos + (d.bWidth/2);
				}
				
				var paddingWidth = d.bWidth * me.rangePadding,
					paddingFactor = (tLen - 1) * .5,
					widthFactor = paddingFactor + .5;
				
				return d.xPos + (d.bWidth * widthFactor) + (paddingWidth * paddingFactor);
			})
			.attr('y', me.canvasHeight - (me.margins.bottomText + ((me.margins.bottom - me.margins.bottomText)/2)))
			.text(function(d, i) {
				return d[me.secondaryGrouper];
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
			.tickFormat(function(d) { return ''; })
			.orient('bottom');
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Set the Y (value) scale
 	 */
	setYScale: function() {
		var me = this;
		
		var yDataMetric = me.yDataMetric;
		
		var maxVal = d3.max(me.graphData, function(d) {
			return d[yDataMetric];
		});
		
		me.yScale = d3.scale.linear()
			.domain([maxVal, 0])
			.range([me.canvasHeight - me.margins.top, me.margins.bottom]);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.AdvancedGroupedBar
 	 * @description Set the scale for the Y axis (different range)
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		var yDataMetric = me.yDataMetric;
		
		var maxVal = d3.max(me.graphData, function(d) {
			return d[yDataMetric];
		});
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, maxVal])
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
			
			me.gLegend.attr('transform', function() {
				var ltx = me.margins.left 
			 		+ (me.getFlexUnit() * me.chartFlex) 
				 	+ me.spaceBetweenChartAndLegend;
			 	return 'translate(' + ltx + ',' + me.margins.top + ')';
		 	});
		 	
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
        
        ////////////////////////////////////////
        // PRIMARY RECTANGLES
        ////////////////////////////////////////
        if(elType == 'rect') {
        	// this rectangle
        	me.mouseEventRect(d3.select(el), evt);
        	
        	// corresponding legend rect
        	me.mouseEventLegendRect(
	        	me.gLegend.selectAll('rect').filter(function(e, j) {
		        	return d[me.tertiaryGrouper] == e.name;
		        }),
		        evt
		    );

        	// corresponding legend text
        	me.mouseEventLegendText(
	        	me.gLegend.selectAll('text').filter(function(e, j) {
		        	return d[me.tertiaryGrouper] == e.name;
		        }),
		        evt
		    );
        }
        
        ////////////////////////////////////////
        // LEGEND RECTANGLES
        ////////////////////////////////////////
        if(elType == 'legendRect') {
	        // this legend rectangle
	        me.mouseEventLegendRect(d3.select(el), evt);
	        
	        // corresponding primary rectangle
	        me.mouseEventRect(
		        me.gBar.selectAll('rect').filter(function(e, j) {
			        return d.name == e[me.tertiaryGrouper];
			    }),
			    evt
			);
	        
	        // corresponding legend text
			me.mouseEventLegendText(
	        	me.gLegend.selectAll('text').filter(function(e, j) {
		        	return d.name == e.name;
		        }),
		        evt
		    );
		}
		
		////////////////////////////////////////
		// LEGEND TEXT
		////////////////////////////////////////
		if(elType == 'legendText') {
			// this legend text
			me.mouseEventLegendText(d3.select(el), evt);
			
			// corresponding primary rectangle
	        me.mouseEventRect(
		        me.gBar.selectAll('rect').filter(function(e, j) {
			        return d.name == e[me.tertiaryGrouper];
			    }),
			    evt
			);
	        
	        // corresponding legend rect
			me.mouseEventLegendRect(
	        	me.gLegend.selectAll('rect').filter(function(e, j) {
		        	return d.name == e.name;
		        }),
		        evt
		    );
		}
        
        /*
        // message bus
        if(me.handleEvents && me.eventRelay && me.mouseEvents[evt].enabled) {
            me.eventRelay.publish(me.mouseEvents[evt].eventName, {
                payload: d,
                index: i
            });
        }*/
    },
    
    /**
     * @function
     * @description Handle mouse event for primary rectangles
     */
    mouseEventRect: function(selection, evt) {
    	var me = this;
    	
    	if(evt == 'mouseover') {
	    	selection.style('opacity', me.opacities.rect.over);
	    }
	    if(evt == 'mouseout') {
		    selection.style('opacity', me.opacities.rect.default);
		}
    },
    
    /**
     * @function
     * @description Handle mouse event for legend rectangles
     */
    mouseEventLegendRect: function(selection, evt) {
	    var me = this;
	    
	    if(evt == 'mouseover') {
		    selection.style('opacity', me.opacities.rect.over);
	    }
	    if(evt == 'mouseout') {
	    	selection.style('opacity', me.opacities.rect.default);
	    }
	},
	
	/**
	 * @function
	 * @description Handle mouse event for legend text
	 */
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
 	 * @description Get a unique, sorted array of certain properties from the data
 	 */
 	getUniqueProperty: function(propName) {
 		var me = this;
 		
 		return Ext.Array.unique(Ext.Array.sort(
 			Ext.Array.pluck(me.graphData, propName)
		));
 	},
 	
 	/**
  	 * @function
  	 * @description Build the primary grouper configuration.  This configuration
  	 * helps determine position of bars and labels in the rangeBand() scale
  	 */
 	buildPrimaryGrouperConfig: function() {
	 	var me = this;
 	
 		var p = me.getUniqueProperty(me.primaryGrouper),
	 		s = me.getUniqueProperty(me.secondaryGrouper),
	 		t = me.getUniqueProperty(me.tertiaryGrouper),
	 		sxt = s.length * t.length;	// length of secondaries * length of tertiaries
 	
 	
 		return Ext.Array.map(p, function(item, index) {
		
			var domainToUse = Ext.Array.map(
				Ext.Array.slice(me.graphData, index*sxt, (index*sxt)+sxt),
				function(item) { return item.id; }
			);
			
			return {
				primary: item,
				xs: d3.scale.ordinal()
					.domain(domainToUse)
					.rangeRoundBands([
						me.xScale(item),
						me.xScale(item) + me.xScale.rangeBand()
					], me.rangePadding, me.rangeOuterPadding)
			};
		});
	},
 	
 	/**
  	 *
  	 * GETTERS
  	 *
  	 */
  	getGraphData: function() {
	  	return this.graphData;
	},
	
  	getPrimaryGrouper: function() {
	  	return this.primaryGrouper;
	},
	
	getSecondaryGrouper: function() {
		return this.secondaryGrouper;
	},
	
	getTertiaryGrouper: function() {
		return this.tertiaryGrouper;
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
	
	setLabelFunction: function(fn) {
		var me = this;
		me.labelFunction = fn;
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
	
	setShowBarLabels: function(bool) {
		var me = this;
		me.showBarLabels = bool;
	},
	
	setShowLegend: function(bool) {
		var me = this;
		me.showLegend = bool;
	},
	
	setTertiaryGrouper: function(g) {
		var me = this;
		me.tertiaryGrouper = g;
	}
});