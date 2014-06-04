/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Simple pie chart class
 */
Ext.define('App.util.d3.final.PieChart', {

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
	chartTitle: null,
	colorScale: d3.scale.category20(),
	indexedColorScale: [],
	hashedColorScale: null,
	hashedColorIndex: null,
	dataMetric: null,
	eventRelay: null,
	gLegend: null,			// "g" element to hold the legend (if applicable)
	gPie: null,				// "g" element to hold the pie chart
	gTitle: null,			// "g" element to hold the title
	graphData: [],
	handleEvents: false,
	innerRadius: 0,
	labelClass: 'labelText',
	labelFunction: function(data, index) { return 'label'; },
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
	spaceBetweenChartAndLegend: 20,		// spacing between the chart and the legend
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * constructor
 	 */
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus')
		}
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.final.PieChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) { return; }
		
		//////////////////////////////////////////////////
		// bring vars into local scope
		//////////////////////////////////////////////////
		var canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			chartFlex = me.chartFlex,
			chartTranslateX = 0,
			chartTranslateY = 0,
			colorScale = me.colorScale,
			dataMetric = me.dataMetric,
			eventRelay = me.eventRelay,
			handleEvents = me.handleEvents,
			indexedColorScale = me.indexedColorScale,
			hashedColorScale = me.hashedColorScale,
			hashedColorIndex = me.hashedColorIndex,
			legendFlex = me.legendFlex,
			legendLines = me.legendLines,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth,
			legendTranslateX = 0,
			legendTranslateY = 0,
			mouseEvents = me.mouseEvents,
			showLegend = me.showLegend;
			
		//////////////////////////////////////////////////
		// set the outer radius if not specified
		// take into account use of the legend
		//////////////////////////////////////////////////
		if(me.outerRadius == null) {
			if(me.showLegend)
			{
				var chartWidth = parseInt(me.getFlexUnit() * me.chartFlex);
				
				// chart width LESS THAN height
				if(chartWidth < (me.canvasHeight - me.margins.top)) {
					me.outerRadius = parseInt((chartWidth/2) * .7);
				}
				else {
					me.outerRadius = parseInt(((me.canvasHeight - me.margins.legend)/2) * .8);
				}
			}
			else
			{
				if(me.canvasWidth < me.canvasHeight) {
					me.outerRadius = parseInt((me.canvasWidth * .85)/2);
				} else {
					// me.outerRadius = parseInt((me.canvasHeight * .85)/2) - me.margins.top;
					me.outerRadius = parseInt((me.canvasHeight/2) * .85) - me.margins.top;
				}
			}
		}
		var outerRadius = me.outerRadius;	// local scope
		
		//////////////////////////////////////////////////
		// sanity check on inner radius
		//////////////////////////////////////////////////
		if(me.innerRadius >= me.outerRadius) {
			me.innerRadius = parseInt(me.outerRadius * .75);
		}
		var innerRadius = me.innerRadius;	// local scope
			
		//////////////////////////////////////////////////
		// chart translation X/Y...based on the use or 
		// omission of the legend
		//////////////////////////////////////////////////
		if(showLegend) {
			chartTranslateX = parseInt((me.getFlexUnit() * me.chartFlex)/2);
			chartTranslateY = me.outerRadius + me.margins.legend;
		} else {
			chartTranslateX = parseInt(me.canvasWidth/2);
			chartTranslateY = parseInt(me.canvasHeight/2) + me.margins.top;
		}

		//////////////////////////////////////////////////
		// set the pie "g" element
		//////////////////////////////////////////////////
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
			
		//////////////////////////////////////////////////
		// the legend "g"
		//////////////////////////////////////////////////
		me.gLegend = me.svg.append('svg:g');
		if(showLegend) {
			legendTranslateX = (me.getFlexUnit() * me.chartFlex) + me.spaceBetweenChartAndLegend;
			legendTranslateY = me.margins.legend;
			me.gLegend.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
		} else {
			me.gLegend.attr('transform', 'translate(0,' + me.margins.top + ')');
		}
		
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

		/*//////////////////////////////////////////////////
		// set the arc selection
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc')
			.on('mouseover', function(d, i) {
				d3.select(this).attr('transform', 'scale(1.1)');
				
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
			})
			.on('mouseout', function(d, i) {
				d3.select(this).attr('transform', 'scale(1)');
			});
			
		//////////////////////////////////////////////////
		// append the paths
		//////////////////////////////////////////////////
		var gLegend = me.gLegend;
		
		segments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				if(hashedColorScale != null) {
					return hashedColorScale[d.data[hashedColorIndex]];
				}
				else if(indexedColorScale.length > 0) {
					return indexedColorScale[i];
				} else {
					return colorScale(i);
				}
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
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
			});*/
		
		//////////////////////////////////////////////////
		// handle labels, chart title, and legend
		//////////////////////////////////////////////////
		me.handleArcs();
		me.handleLabels();
		me.handleChartTitle();
		me.handleLegend();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.PieChart
 	 * @description Transition the graphic
 	 */
	transition: function() {
		
		var me = this;
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var colorScale = me.colorScale,
			dataMetric = me.dataMetric,
			eventRelay = me.eventRelay,
			handleEvents = me.handleEvents,
			indexedColorScale = me.indexedColorScale,
			hashedColorScale = me.hashedColorScale,
			hashedColorIndex = me.hashedColorIndex,
			innerRadius = me.innerRadius,
			legendLines = me.legendLines,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			mouseEvents = me.mouseEvents,
			outerRadius = me.outerRadius,
			showLegend = me.showLegend,
			gLegend = me.gLegend;
			
		//////////////////////////////////////////////////
		// new value function for pie layout
		/*//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[dataMetric];
		});
		
		//////////////////////////////////////////////////
		// join new arcs with old arcs
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData));
		
		//////////////////////////////////////////////////	
		// transition out old segments
		//////////////////////////////////////////////////
		segments.exit().remove();
		
		//////////////////////////////////////////////////	
		// build new segments
		//////////////////////////////////////////////////
		var newSegments = segments.enter()
			.append('g')
			.attr('class', 'arc')
			.on('mouseover', function(d, i) {
				d3.select(this).attr('transform', 'scale(1.1)');
				
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
			})
			.on('mouseout', function(d, i) {
				d3.select(this).attr('transform', 'scale(1)');
			});
			
		//////////////////////////////////////////////////
		// append paths to new segments
		//////////////////////////////////////////////////	
		newSegments.append('path')
			.attr('d', me.arcObject)
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
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
		// handle path changes
		//////////////////////////////////////////////////	
		me.svg.datum(me.graphData).selectAll('path')
			.data(me.pieLayout)
			.transition()
			.duration(500)
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
		// re-call the tooltip function for
		// revised data
		//////////////////////////////////////////////////
		newSegments.call(d3.helper.tooltip().text(me.tooltipFunction));*/
		
		//////////////////////////////////////////////////
		// handle labels, chart title, and legend
		//////////////////////////////////////////////////
		me.handleArcs();
		me.handleLabels();
		me.handleChartTitle();
		me.handleLegend();
	},
	
	/**
 	 * @function
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
			gPie = me.gPie;
			
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
				d3.select(this).transition().attr('transform', 'scale(1.1)');
			
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
			})
			.on('mouseout', function(d, i) {
				d3.select(this).transition().attr('transform', 'scale(1)');
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
 	 * @description Generate the arc labels for the pie chart
 	 */
 	handleLabels: function() {
	 	var me = this;
	 	
	 	if(!me.showLabels) {
		 	me.gPie.selectAll('text').remove();
		 	return;
		 }

		var arc = me.arcObject,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius;
	 	
	 	var textSelection = me.gPie.selectAll('text')
		 	.data(me.pieLayout(me.graphData));
		
		textSelection.exit().remove();
		
		textSelection.enter()
			.append('text')
			.attr('class', me.labelClass)
			.attr('dy', function(d, i) {
				return '0.35em';
			})
			
		textSelection.transition().duration(250)
			.attr('transform', function(d, i) {
				var c = arc.centroid(d),
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
			.text(me.labelFunction);
	 	
	 	// SEE IF I CAN JOIN, REMOVE, APPEND, TRANSITION HERE
	 	
	 	/*me.gPie.selectAll('text').remove();
	 	
	 	if(!me.showLabels) { return; }
	 	
	 	var arc = me.arcObject,
		 	outerRadius = me.outerRadius || 200,
		 	segmentSelection = me.gPie.selectAll('.arc');
	 	
	 	segmentSelection.append('text')
			.attr('transform', function(d, i) {
				var c = arc.centroid(d),
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
			.attr('dy', function(d, i) {
				return '0.35em';
			})
			.attr('text-anchor', function(d, i) {
				return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
			})
			.attr('class', me.labelClass)
			.text(me.labelFunction);*/
	},
	
	/**
 	 * @function
 	 * @description Initialize the title "g" element, if applicable
 	 * and transition the chart title
 	 */
	handleChartTitle: function() {
		var me = this;
		
		// initialize the title "g"
		if(me.gTitle == null) {
			me.gTitle = me.svg.append('svg:g')
				.attr('transform', 'translate(' 
					+ parseInt(me.canvasWidth/2) 
					+ ',' 
					+ parseInt(me.margins.top/2) + ')'
				);
				
			me.gTitle.selectAll('text')
				.data([''])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
		
		if(me.chartTitle) {
			me.gTitle.selectAll('text').text(me.chartTitle);
		} else {
			me.gTitle.selectAll('text').text('');
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.PieChart
 	 * @description Handle the legend drawing / transition
 	 */
 	handleLegend: function() {
	 	var me = this;
	 	
	 	if(!me.showLegend) { return; }
	 	
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
	 	//
	 	// legend rectangles
	 	//
	 	////////////////////////////////////////
	 	
	 	// join new rects with current squares
	 	var legendSquareSelection = me.gLegend.selectAll('rect')
		 	.data(me.graphData);
		 	
		// remove old rects
		legendSquareSelection.exit().remove();
		
		// add new rects
		legendSquareSelection.enter().append('rect');
		
		// transition all...legendLines dictates the 
		// the vertical spacing between the rects
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
	 	// legend text
	 	// special considerations for multi-line
	 	// text elements
	 	//
	 	////////////////////////////////////////
	 	
	 	// multi-line text elements for legend
	 	// we need to bind new data to this
	 	if(legendLines > 1) {
		 	var useData = [];
		 	
		 	var ind = 0;
		 	Ext.each(me.graphData, function(d, i) {
			 	useData = useData.concat(me.legendTextFunction(d, ind).split('|'));
			 	ind++;
			}, me);
			
			// join new text with current text
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(useData);
				
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
					if(i%legendLines == 0) {
						// highlight this text
						d3.select(this).style('fill', '#990066');
						
						// highlight the selected arc
						thePie.selectAll('.arc').filter(function(e, j) {
							return i/legendLines == j;
						})
						.transition()
						.attr('transform', 'scale(1.1)')
						.selectAll('path')
						.style('opacity', 1);
					}
				})
				.on('mouseout', function(d, i) {
					if(i%legendLines == 0) {
						// un-highlight
						d3.select(this).style('fill', '#000000');
					
						// select the arc and transition
						thePie.selectAll('.arc').filter(function(e, j) {
							return i/legendLines == j;
						})
						.transition()
						.attr('transform', 'scale(1)')
						.selectAll('path')
						.style('opacity', 0.6);
					}
				})
				.attr('class', function(d, i) {
					if(i%legendLines == 0) {
						return legendBoldClass;
					}
					return legendClass;
				});
				
			// transition all
			legendTextSelection.transition().text(function(d, i) {
				if(i%legendLines != 0) {
					return '- ' + d;
				}
				return d;
			});
	 	} else {
			// join new text with current text
			var legendTextSelection = me.gLegend.selectAll('text')
				.data(me.graphData);
				
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
					// highlight this text
					d3.select(this)
						.style('fill', '#990066')
						.style('font-weight', 'bold');
						
					// highlight the selected arc
					thePie.selectAll('.arc').filter(function(e, j) {
						return i == j;
					})
					.transition()
					.attr('transform', 'scale(1.1)')
					.selectAll('path')
					.style('opacity', 1);
				})
				.on('mouseout', function(d, i) {
					// un-highlight this text
					var el = d3.select(this);
					el.style('fill', '#000000')
						.style('font-weight', 'normal');
					
					// select the arc and transition
					thePie.selectAll('.arc').filter(function(e, j) {
						return i == j;
					})
					.transition()
					.attr('transform', 'scale(1)')
					.selectAll('path')
					.style('opacity', 0.6);
				})
				.attr('class', me.legendClass);
				
			// transition all
			legendTextSelection.transition().text(me.legendTextFunction);
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.final.PieChart
 	 * @description Get the width of 1 "flex" unit based on configurations
 	 */
	getFlexUnit: function() {
		var me = this;
		
		var workingWidth = me.canvasWidth - me.spaceBetweenChartAndLegend;
		
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	},
	
	
	/**
 	 *
 	 *
 	 * setters
 	 *
 	 *
 	 */
 	 
	/**
 	 * @description Set the arc object function
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
	
	/**
 	 * @description Set the default data metric
 	 */
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
	
	setTooltipFunction: function(fn) {
		var me = this;
		
		me.tooltipFunction = fn;
	}
});