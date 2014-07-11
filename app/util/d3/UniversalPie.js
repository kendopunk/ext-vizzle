/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly configurable responsive pie chart
 */
Ext.define('App.util.d3.UniversalPie', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
	 * other configurations
	 */
	arcObject: null,
	canvasHeight: 200,
	canvasWidth: 200,
	chartFlex: 3,
	chartInitialized: false,
	chartTitle: null,
	colorPalette: 'default',
	colorScale: d3.scale.category20(0),
	indexedColorScale: [],
	hashedColorScale: null,
	hashedColorIndex: null,
	dataMetric: null,
	eventRelay: null,
	gLegend: null,			// "g" element to hold the legend (if applicable)
	gPie: null,				// "g" element to hold the pie chart
	gTitle: null,			// "g" element to hold the title
	gSandbox: null,			// "g" element for testing
	graphData: [],
	handleEvents: false,
	innerRadius: 0,
	labelClass: 'labelText',
	labelFunction: function(data, index) { return 'label'; },
	labelVisibilityThreshold: 0.02,
	legendFlex: 1,
	legendLines: 1,		// # of line per legend text item
	legendSquareWidth: 10,
  	legendSquareHeight: 10,
  	legendTextFunction: function(data, index) { return 'legend item'; },
  	legendClass: 'legendText',
  	legendYOffset: 20,		// close to the top....adjust to move pie/legend down
  	legendBoldClass: 'legendTextBold',
	margins: {				// IMPORTANT: legend must be >= top
		top: 30,
		legend: 50
	},
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
	outerRadius: null,
	panelId: null,
	pieLayout: null,
	showLabels: false,
	showLegend: false,
	sortType: null,
	spaceBetweenChartAndLegend: 20,		// spacing between the chart and the legend
	radiusScaleFactor: .75,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * constructor
 	 */
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
		
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus')
		}
	},
	
	/**
	 * @function
	 */
	initChart: function() {
		var me = this,
			outerRadius,
			innerRadius;
		
		////////////////////////////////////////
		// set the outer radius, taking into account
		// the use of the legend
		////////////////////////////////////////
		if(me.outerRadius == null) {
			me.outerRadius = me.calcRadius();
			outerRadius = me.outerRadius;
		} else {
			outerRadius = me.outerRadius;
		}
		
		////////////////////////////////////////
		// sanity check on inner radius
		////////////////////////////////////////
		if(me.innerRadius >= me.outerRadius) {
			me.innerRadius = Math.floor(me.outerRadius * .75);
		}
		innerRadius = me.innerRadius;
		
		////////////////////////////////////////
		// chart translation
		////////////////////////////////////////
		var chartTranslateX, chartTranslateY;
		if(me.showLegend) {
			chartTranslateX = Math.floor((me.getFlexUnit() * me.chartFlex) / 2);
			chartTranslateY = Math.floor(me.canvasHeight / 2);
		} else {
			chartTranslateX = Math.floor(me.canvasWidth / 2);
			chartTranslateY = Math.floor(me.canvasHeight / 2);
		}

		//////////////////////////////////////////////////
		// pie "g"
		//////////////////////////////////////////////////
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
			
		//////////////////////////////////////////////////
		// legend "g"
		//////////////////////////////////////////////////
		legendTranslateX = (me.getFlexUnit() * me.chartFlex) + me.spaceBetweenChartAndLegend;
		legendTranslateY = (me.canvasHeight / 2) - me.outerRadius;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
			
		//////////////////////////////////////////////////
		// title "g"
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
				+ Math.floor(me.canvasWidth/2)
				+ ','
				+ Math.floor(me.margins.top/2)
				+')'
			);
			
		//////////////////////////////////////////////////
		// sandbox "g"
		//////////////////////////////////////////////////
		me.gSandbox = me.svg.append('svg:g');
			
		//////////////////////////////////////////////////
		// set the pie layout
		//////////////////////////////////////////////////
		me.pieLayout = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[dataMetric];
			});
		
		//////////////////////////////////////////////////
		// set the arc objects
		//////////////////////////////////////////////////
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
			
		me.chartInitialized = true;
		
		return me;
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.final.PieChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function() {
		var me = this;
		
		if(!me.chartInitialized) {
			return;
		}
		
		// happens first
		me.setColorScale();
		me.checkSort();
		
		// handlers
		me.handleArcs();
		me.handleLabels();
		me.handleChartTitle();
		me.handleLegend();
		
		
		/*
		me.gSandbox.selectAll('circle')
			.data(['a'])
			.enter()
			.append('circle')
			.attr('cx', me.canvasWidth/2)
			.attr('cy', me.canvasHeight/2)
			.attr('r', 5)
			.style('fill', '#000000');
		*/
	},
	
	/**
 	 * @function
 	 * @description Handle drawing/transitioning of arc elements
 	 */
	handleArcs: function() {
		var me = this;
		
		var colorScale = me.colorScale,
			hashedColorScale = me.hashedColorScale,
			hashedColorIndex = me.hashedColorIndex,
			indexedColorScale = me.indexedColorScale,
			dataMetric = me.dataMetric,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			gLegend = me.gLegend,
			showLegend = me.showLegend,
			legendLines = me.legendLines,
			arcObject = me.arcObject,
			gPie = me.gPie,
			outerRadius = me.outerRadius;
			
		//////////////////////////////////////////////////
		// NEW METRIC FN()
		// FOR PIE LAYOUT
		//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[dataMetric];
		});
		
		//////////////////////////////////////////////////
		// join new arcs with old arcs
		//////////////////////////////////////////////////
		var arcSelection = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData));
			
		//////////////////////////////////////////////////
		// remove old arcs
		//////////////////////////////////////////////////
		arcSelection.exit().remove();
		
		//////////////////////////////////////////////////
		// append new arcs
		//////////////////////////////////////////////////
		var newArcs = arcSelection.enter()
			.append('g')
			.attr('class', 'arc')
			.on('mouseover', function(d, i) {
				// scale this arc
				// scale arc's label
				// publish mouse event
				d3.select(this).transition().attr('transform', 'scale(1.1)');
				me.transformLabel(i);
				me.publishMouseEvent('mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				// unscale this arc
				// unscale arc's label
				// publish mouse event
				d3.select(this).transition().attr('transform', 'scale(1)');
				me.revertLabel(i);
				me.publishMouseEvent('mouseout', d, i);
			});
		
		//////////////////////////////////////////////////
		// append paths to new arcs
		//////////////////////////////////////////////////
		newArcs.append('path')
			.style('opacity', .6)
			.style('fill', '#FFFFFF')
			.attr('d', d3.svg.arc().outerRadius(0).innerRadius(0)) // overridden later
			.on('mouseover', function(d, i) {
				d3.select(this).style('opacity', 1);
				
				// mouseover wedge = highlight legend element
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
					return i * legendLines == j;
					})
					.style('fill', '#990066')
					.style('font-weight', 'bold');
				}
			})
			.on('mouseout', function(d, i) {
				d3.select(this).style('opacity', 0.6);
			
				// un-highlight legend
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
						return i * legendLines == j;
					})
					.style('fill', 'black')
					.style('font-weight', function(d, i) {
						if(legendLines > 1) {
							return 'bold';
						}
						return 'normal';
					});
				}
			});
		
		//////////////////////////////////////////////////
		// bind data and transition paths
		//////////////////////////////////////////////////
		me.gPie.selectAll('.arc path')
			.data(me.pieLayout(me.graphData))
			.transition()
			.duration(250)
			.style('fill', function(d, i) {
				if(hashedColorScale != null) {
					return hashedColorScale[d.data[hashedColorIndex]];
				} else if(indexedColorScale.length > 0) {
					return indexedColorScale[i];
				} else {
					return colorScale(i);
				}
			})
			.attr('d', me.arcObject);
		
		//////////////////////////////////////////////////
		// call / recall the tooltip function
		//////////////////////////////////////////////////
		me.gPie.selectAll('.arc').call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	/**
 	 * @function
 	 * @description Handle drawing/transitioning of labels
 	 */
 	handleLabels: function() {
	 	var me = this;
	 	
	 	if(!me.showLabels) {
		 	me.gPie.selectAll('text')
			 	.remove();
		 	return;
	 	}
		
		// local scope
		var arcObject = me.arcObject,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius,
			labelVisibilityThreshold = me.labelVisibilityThreshold;
			
		////////////////////////////////////////
		// Join, Remove, Append, Transition
		// JRAT
		////////////////////////////////////////
		var textSelection = me.gPie.selectAll('text')
			.data(me.pieLayout(me.graphData));
			
		textSelection.exit().remove();
		
		textSelection.enter()
			.append('text')
			.attr('class', me.labelClass)
			.attr('dy', '0.35em');
			
		textSelection.transition().duration(250)
			.attr('transform', function(d, i) {
				var c = arcObject.centroid(d),
					x = c[0],
					y = c[1],
					h = Math.sqrt(x*x + y*y),
					xTrans = (x/h * outerRadius) + (x/h * outerRadius * .05),
					yTrans = (y/h * outerRadius) + i;
						
				if(yTrans < 0) {
					yTrans = yTrans - Math.abs(yTrans * .1);
				}
					
				return 'translate(' + xTrans + ',' + yTrans + ')';
			})
			.attr('text-anchor', function(d, i) {
				return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
			})
			.attr('display', function(d, i) {
				if(Math.abs(d.startAngle - d.endAngle) < labelVisibilityThreshold) {
					return 'none';
				}
				return null;
			})
			.text(me.labelFunction);
	},
	
	/**
 	 * @function
 	 * @description Initialize the title "g" element, if applicable
 	 * and transition the chart title
 	 */
	handleChartTitle: function() {
		var me = this;
		
		me.gTitle.selectAll('text').remove();
		
		if(me.chartTitle) {
			me.gTitle.selectAll('text')
			.data([me.chartTitle])
			.enter()
			.append('text')
			.style('fill', '#444444')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.style('text-anchor', 'middle')
			.text(String);
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.PieChart
 	 * @description Handle the legend drawing / transition
 	 */
 	handleLegend: function() {
	 	var me = this;
	 	
	 	////////////////////////////////////////
	 	// no legend / remove legend
	 	////////////////////////////////////////
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
	 	
	 	////////////////////////////////////////
	 	// local scope
		////////////////////////////////////////
	 	var colorScale = me.colorScale,
	 		dataMetric = me.dataMetric,
	 		indexedColorScale = me.indexedColorScale,
	 		hashedColorScale = me.hashedColorScale,
	 		hashedColorIndex = me.hashedColorIndex,
	 		legendSquareHeight = me.legendSquareHeight,
	 		legendSquareWidth = me.legendSquareWidth,
	 		legendLines = me.legendLines,
	 		thePie = me.gPie,
	 		legendClass = me.legendClass,
	 		legendBoldClass = me.legendBoldClass;
	 		
	 	////////////////////////////////////////
	 	// LEGEND SQUARES - JRAT
	 	////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
		 	.data(me.graphData);
		
		legendSquareSelection.exit().remove();
		
		legendSquareSelection.enter().append('rect')
			.style('opacity', .6)
			.on('mouseover', function(d, i) {
				// square opacity -> up
				// transform corresponding arc, label
				// publish mouse event
				d3.select(this).style('opacity', .9);
				me.transformArc(i);
				me.transformLabel(i);
				me.publishMouseEvent('mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				// square opacity -> down
				// revert corresponding arc, label
				// publish mouse event
				d3.select(this).style('opacity', .6);
				me.revertArc(i);
				me.revertLabel(i);
				me.publishMouseEvent('mouseout', d, i);
			});

	 	legendSquareSelection.transition()
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendLines * legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.attr('fill', function(d, i) {
				if(hashedColorScale != null) {
					return hashedColorScale[d[hashedColorIndex]];
				} else if(indexedColorScale.length > 0) {
					return indexedColorScale[i];
				} else {
					return colorScale(i);
				}
			});
 	
 		////////////////////////////////////////
	 	//
	 	// LEGEND TEXT
	 	// MULTIPLE LEGEND TEXT LINES OR
	 	// SINGLE LEGEND TEXT LINES
	 	//
	 	////////////////////////////////////////
		if(legendLines > 1) {
		 	var ind = 0,
		 		multilineData = [];
		 		
		 	Ext.each(me.graphData, function(d, i) {
		 		Ext.each(me.legendTextFunction(d, i).split('|'), function(str) {
			 		multilineData.push({
				 		textLabel: str,
				 		copiedData: d
				 	});
				}, me);
			}, me);
			
			// join new text with current text
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(multilineData);

			// remove old text
			legendTextSelection.exit().remove();
			
			// add new
			legendTextSelection.enter().append('text')
				.attr('x', legendSquareWidth * 2)
				.attr('y', function(d, i) {
					return i * legendSquareHeight * 1.75;
				})
				.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
				.on('mouseover', function(d, i) {
				
					if(i%legendLines == 0)
					{
						// highlight this text
						// transform corresponding arc and its label
						// publish mouse event
						d3.select(this)
							.style('fill', '#990066')
							.style('font-weight', 'bold');
						me.transformArc(i/legendLines);
						me.transformLabel(i/legendLines);
						me.publishMouseEvent('mouseover', d.copiedData, i);
					}
				})
				.on('mouseout', function(d, i) {
				
					if(i%legendLines == 0)
					{
						// un-highlight text
						// revert corresponding arc
						// revert corresponding arc's label
						// publish mouse event
						d3.select(this)
							.style('fill', 'black')
							.style('font-weight', function() {
								return legendLines > 1 ? 'bold' : 'normal';
							});
						me.revertArc(i/legendLines);
						me.revertLabel(i/legendLines);
						me.publishMouseEvent('mouseout', d.copiedData, i);
					}
				})
				.attr('class', function(d, i) {
					if(i%legendLines == 0) {
						return legendBoldClass;
					}
					return legendClass;
				});
				
			legendTextSelection.transition().text(function(d, i) {
				if(i%legendLines != 0) {
					return '- ' + d.textLabel;
				}
				return d.textLabel;
			});
	 	}
	 	////////////////////////////////////////
	 	// SINGLE LINE JRAT
	 	////////////////////////////////////////
	 	else {
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(me.graphData);

			legendTextSelection.exit().remove();
			
			legendTextSelection.enter().append('text')
				.attr('x', legendSquareWidth * 2)
				.attr('y', function(d, i) {
					return i * legendSquareHeight * 1.75;
				})
				.attr('class', me.legendClass)
				.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
				.on('mouseover', function(d, i) {
					// highlight this text
					// transform corresponding arc and its label
					// publish mouse event
					d3.select(this)
						.attr('class', legendBoldClass)
						.style('fill', '#990066')
						.style('font-weight', 'bold');
					me.transformArc(i);
					me.transformLabel(i);
					me.publishMouseEvent('mouseover', d, i);
				})
				.on('mouseout', function(d, i) {
					// un-highlight this text
					// revert corresponding arc and its label
					// publish mouse event
					d3.select(this)
						.attr('class', legendClass)
						.style('fill', '#000000')
						.style('font-weight', 'normal');
					me.revertArc(i);
					me.revertLabel(i);
					me.publishMouseEvent('mouseout', d, i);
				});
				
			// transition all
			legendTextSelection.transition().text(me.legendTextFunction);
		}
	},
	
	/**
 	 * @function
 	 * @description Runtime calculation of outer radius
 	 */
 	calcRadius: function() {
	 	var me = this,
	 		ret = 0;
	 	
	 	var chartHeight = me.canvasHeight - me.margins.top;
	 	
		if(me.showLegend) {
			var chartWidth = Math.floor(me.getFlexUnit() * me.chartFlex);
			ret = (Ext.Array.min([chartWidth, chartHeight]) * me.radiusScaleFactor) / 2;
		} else {
			ret = (Ext.Array.min([me.canvasWidth, chartHeight]) * me.radiusScaleFactor) / 2;
		}
		
		return ret;
	},
	
	/**
	 * @function
	 * @description Toggle legend on/off
	 * @param onState Boolean
	 */
	toggleLegend: function(onState) {
		var me = this,
			chartTranslateX,
			chartTranslateY;
			
		if(onState) {
			chartTranslateX = Math.floor((me.getFlexUnit() * me.chartFlex) / 2);
			chartTranslateY = Math.floor(me.canvasHeight / 2);
			me.showLegend = true;
		} else {
			chartTranslateX = Math.floor(me.canvasWidth / 2);
			chartTranslateY = Math.floor(me.canvasHeight / 2);
			me.showLegend = false;
		}
		
		me.gPie.transition()
			.duration(500)
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
			
		me.outerRadius = me.calcRadius();
		me.setArcObject();
		
		return me;
	},
	
	/**
 	 * @function
 	 * @description Retrieve the width of one "flex" unit
 	 */
 	getFlexUnit: function() {
		var me = this;
		
		return Math.floor(me.canvasWidth / (me.chartFlex + me.legendFlex));
	},
	
	/**
 	 * @function
 	 * @description Transform a particular arc
 	 * @param indexToMatch Integer
 	 */
	transformArc: function(indexToMatch) {
		var me = this;
		
		me.gPie.selectAll('.arc').filter(function(d, i) {
			return indexToMatch === i;
		})
		.transition()
		.attr('transform', 'scale(1.1)')
		.selectAll('path')
		.style('opacity', 1);
	},
	
	/**
 	 * @function
 	 * @description Reset/revert a particular arc
 	 * @param indexToMatch Integer
 	 */
	revertArc: function(indexToMatch) {
		var me = this;
		
		me.gPie.selectAll('.arc').filter(function(d, i) {
			return indexToMatch === i;
		})
		.transition()
		.attr('transform', 'scale(1)')
		.selectAll('path')
		.style('opacity', 0.6);
	},
	
	/**
 	 * @function
 	 * @description Transform a particular label
 	 * @param indexToMatch Integer
 	 */
	transformLabel: function(indexToMatch) {
		var me = this;
		
		// local scope
		var arcObject = me.arcObject,
			outerRadius = me.outerRadius;
		
		me.gPie.selectAll('text').filter(function(d, i) {
			return indexToMatch === i;
		})
		.transition()
		.duration(250)
		.attr('transform', function(d, i) {
			var c = arcObject.centroid(d),
				x = c[0],
				y = c[1],
				h = Math.sqrt(x*x + y*y),
				xTrans = (x/h * outerRadius) + (x/h * outerRadius * .05),
				yTrans = (y/h * outerRadius) + i;
						
			if(yTrans < 0) {
				yTrans = yTrans - Math.abs(yTrans * .1);
			}
					
			xTrans += xTrans * .1;
			yTrans += yTrans * .1;
					
			return 'translate(' + xTrans + ',' + yTrans + ')';
		});
	},
	
	/**
 	 * @function
 	 * @description Reset/revert a particular label
 	 * @param indexToMatch Integer
 	 */
	revertLabel: function(indexToMatch) {
		var me = this;
		
		// local scope
		var arcObject = me.arcObject,
			outerRadius = me.outerRadius;
		
		me.gPie.selectAll('text').filter(function(d, i) {
			return indexToMatch === i;
		})
		.transition()
		.duration(250)
		.attr('transform', function(d, i) {
			var c = arcObject.centroid(d),
				x = c[0],
				y = c[1],
				h = Math.sqrt(x*x + y*y),
				xTrans = (x/h * outerRadius) + (x/h * outerRadius * .05),
				yTrans = (y/h * outerRadius) + i;
						
			if(yTrans < 0) {
				yTrans = yTrans - Math.abs(yTrans * .1);
			}
					
			return 'translate(' + xTrans + ',' + yTrans + ')';
		});
	},
	
	/**
 	 * @function
 	 */
 	checkSort: function() {
	 	var me = this;
	 	
		if(me.sortType !== null) {
		 	if(me.sortType == '_metric_') {
		 		me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
				 	if(a[me.dataMetric] < b[me.dataMetric]) {
					 	return 1;
					} else if(a[me.dataMetric] > b[me.dataMetric]) {
						return -1;
					} else {
						return 0;
					}
			 	}, me));
			 } else {
			 	me.setGraphData(Ext.Array.sort(me.graphData, function(a, b) {
				 	if(a[me.sortType] < b[me.sortType]) {
					 	return -1;
					} else if(a[me.sortType] > b[me.sortType]) {
						return 1;
					} else {
						return 0;
					}
			 	}, me));
			 }
		}
 	},
	
	/**
 	 * @function
 	 * @description Publish a mouse event with the event relay
 	 * @param evt String mouseover|mouseout|etc..
 	 * @param d Object Data object
 	 * @param i Integer index
 	 */
	publishMouseEvent: function(evt, d, i) {
		var me = this;
				
		if(me.handleEvents && me.eventRelay && me.mouseEvents[evt].enabled) {
			me.eventRelay.publish(me.mouseEvents[evt].eventName, {
				payload: d,
				index: i
			});
		}
	},
	
	/**
 	 *
 	 *
 	 * setters
 	 *
 	 *
 	 */
	setArcObject: function() {
		var me = this;
		
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
	},
	
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
		
		if(me.colorPalette == 'sequential') {
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
		} else if(me.colorPalette == 'paired') {
			me.colorScale = d3.scale.ordinal().range(colorbrewer.Paired[12]);
		} else if(me.colorPalette == '20b') {
			me.colorScale = d3.scale.category20b();
		} else {
			me.colorScale = d3.scale.category20();
		}
	},

 	setDataMetric: function(metric) {
	 	var me = this;
	 	
	 	me.dataMetric = metric;
	},
	
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	},
	
	setInnerRadius: function(r) {
		var me = this;
		
		me.innerRadius = r;
		me.setArcObject();
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		
		me.labelFunction = fn;
	},
	
	setLegendTextFunction: function(fn) {
		var me = this;
		
		me.legendTextFunction = fn;
	},

	
	setOuterRadius: function(r) {
		var me = this;
		
		me.outerRadius = r;
		me.setArcObject();
	},
	
	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	},
	
	setSortType: function(st) {
		var me = this;
		
		me.sortType = st;
	},
	
	setTooltipFunction: function(fn) {
		var me = this;
		
		me.tooltipFunction = fn;
	}
});