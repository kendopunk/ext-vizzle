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
	dataMetric: null,
	eventRelay: null,
	gLegend: null,			// "g" element to hold the legend (if applicable)
	gLabel: null,
	gPie: null,				// "g" element to hold the pie chart
	gTitle: null,			// "g" element to hold the title
	graphData: [],
	handleEvents: false,
	innerRadius: 0,
	labelFontSize: '10px',
	labelFunction: function(data, index) { return 'label'; },
	legendFlex: 1,
	legendSquareWidth: 10,
  	legendSquareHeight: 10,
  	legendTextFunction: function(data, index) { return 'legend item'; },
	margins: {
		top: 30
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
			legendFlex = me.legendFlex,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth,
			legendTranslateX = 0,
			legendTranslateY = 0,
			mouseEvents = me.mouseEvents,
			showLegend = me.showLegend;
			
		//////////////////////////////////////////////////
		// chart translation X/Y...based on the use or 
		// omission of the legend
		//////////////////////////////////////////////////
		if(showLegend) {
			chartTranslateX = parseInt((me.getFlexUnit() * me.chartFlex)/2);
			chartTranslateY = parseInt(me.canvasHeight/2) + me.margins.top;
		} else {
			chartTranslateX = parseInt(me.canvasWidth/2);
			chartTranslateY = parseInt(me.canvasHeight/2) + me.margins.top;
		}
		
		//////////////////////////////////////////////////
		// set the outer radius if not specified
		// take into account use of the legend
		//////////////////////////////////////////////////
		if(me.outerRadius == null) {
			if(me.showLegend) {
				var chartWidth = parseInt(me.getFlexUnit() * me.chartFlex);
				if(chartWidth < (me.canvasHeight - me.margins.top)) {
					me.outerRadius = parseInt((chartWidth/2) * .75);
				} else {
					me.outerRadius = parseInt((me.canvasHeight/2) * .75) - me.margins.top;
				}
			} else {
				if(me.canvasWidth < me.canvasHeight) {
					me.outerRadius = parseInt((me.canvasWidth * .85)/2);
				} else {
					me.outerRadius = parseInt((me.canvasHeight * .85)/2) - me.margins.top;
				}
			}
		}
		var outerRadius = me.outerRadius;
		
		//////////////////////////////////////////////////
		// sanity check on inner radius
		//////////////////////////////////////////////////
		if(me.innerRadius >= me.outerRadius) {
			me.innerRadius = parseInt(me.outerRadius * .75);
		}
		var innerRadius = me.innerRadius;
		
		//////////////////////////////////////////////////
		// pie "g"
		// chart title "g"
		// legend "g"
		// label "g"
		//////////////////////////////////////////////////
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
			
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
			
		me.gLegend = me.svg.append('svg:g');
		if(showLegend) {
			legendTranslateX = (me.getFlexUnit() * me.chartFlex) + me.spaceBetweenChartAndLegend;
			legendTranslateY = me.margins.top;
			me.gLegend.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
		}
		
		me.gLabel = me.svg.append('svg:g');
		
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

		//////////////////////////////////////////////////
		// set the arc selection
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc')
			.on('mouseover', function(d, i) {
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
			});
			
		//////////////////////////////////////////////////
		// append the paths
		//////////////////////////////////////////////////
		var gLegend = me.gLegend;
		
		segments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d, i) {
				// wedge stroke = black
				d3.select(this)
				.style('opacity', 1)
				.style('stroke', '#000000');
				
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
						return e[dataMetric] == d.data[dataMetric];
					})
					.style('fill', '#990066')
					.style('font-weight', 'bold');
				}
			})
			.on('mouseout', function(d) {
				// wedge stroke revert to white
				d3.select(this)
				.style('opacity', .6)
				.style('stroke', 'white');
				
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
						return e[dataMetric] == d.data[dataMetric];
					})
					.style('fill', '#000000')
					.style('font-weight', 'normal');
				}
			});
		
		//////////////////////////////////////////////////
		// LABELS, if applicable
		//////////////////////////////////////////////////
		if(me.showLabels) { me.handleLabels(); }
		
		//////////////////////////////////////////////////
		// LEGEND, if applicable
		//////////////////////////////////////////////////
		if(me.showLegend) { me.handleLegend(); }

		//////////////////////////////////////////////////
		// CHART TITLE
		//////////////////////////////////////////////////
		me.handleChartTitle();
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
			innerRadius = me.innerRadius,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			mouseEvents = me.mouseEvents,
			outerRadius = me.outerRadius,
			showLegend = me.showLegend,
			gLegend = me.gLegend;

		//////////////////////////////////////////////////
		// new value function for pie layout
		//////////////////////////////////////////////////
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
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
			});
			
		//////////////////////////////////////////////////
		// append paths to new segments
		//////////////////////////////////////////////////	
		newSegments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d) {
				// wedge stroke black
				d3.select(this)
					.style('opacity', 1)
					.style('stroke', '#000000');
					
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
						return e[dataMetric] == d.data[dataMetric];
					})
					.style('fill', '#990066')
					.style('font-weight', 'bold');
				}
			})
			.on('mouseout', function(d) {
				// wedge stroke revert to white
				d3.select(this);
					el.style('opacity', .6)
					el.style('stroke', 'white');
					
				if(showLegend) {
					gLegend.selectAll('text').filter(function(e, j) {
						return e[dataMetric] == d.data[dataMetric];
					})
					.style('fill', '#000000')
					.style('font-weight', 'normal');
				}
			});
			
		//////////////////////////////////////////////////
		// handle path changes
		//////////////////////////////////////////////////	
		me.svg.datum(me.graphData).selectAll('path')
			.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
		
		//////////////////////////////////////////////////
		// LABELS
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.handleLabels();
		} else {
			me.gPie.selectAll('text')
				.transition()
				.duration(250)
				.attr('y', 1000)
				.remove();
		}

		//////////////////////////////////////////////////
		// LEGEND
		//////////////////////////////////////////////////
		if(me.showLegend) { me.handleLegend(); }
		
		//////////////////////////////////////////////////
		// CHART TITLE
		//////////////////////////////////////////////////
		me.handleChartTitle();
	},
	
	/**
	 * @function
	 * @description Handle the arc labels
	 */
	handleLabels: function() {
		var me = this;
		
		// local scope
		var arc = me.arcObject,
			outerRadius = me.outerRadius;
			
		// get arcs
		var segments = me.gPie.selectAll('.arc');
		
		// remove existing text from the arcs
		segments.selectAll('text').remove();
		
		// append new text to the arcs
		segments.append('text')
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
			.attr('text-anchor', function(d) {
				return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
			})
			.style('font-size', me.labelFontSize)
			.text(me.labelFunction);
	},
	
	/**
 	 * @function
 	 * @description Handle the chart legend
 	 */
 	handleLegend: function() {
	 	var me = this;
	 	
	 	// local scope
	 	var thePie = me.gPie,
	 		legendSquareHeight = me.legendSquareHeight,
	 		legendSquareWidth = me.legendSquareWidth,
	 		colorScale = me.colorScale
	 	
	 	////////////////////////////////////////
	 	// LEGEND SQUARES
	 	////////////////////////////////////////
	 	// join new with old
		var legendSquareSelection = me.gLegend.selectAll('rect')
				.data(me.graphData);
				
		// remove old squares
		legendSquareSelection.exit().remove();
			
		// add new squares
		legendSquareSelection.enter().append('rect')

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
		
		////////////////////////////////////////
	 	// LEGEND TEXT
	 	////////////////////////////////////////
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
				.attr('transform', 'scale(1.1, 1.1)');
			})
			.on('mouseout', function(d, i) {
				// un-highlight this text
				d3.select(this)
					.style('fill', '#000000')
					.style('font-weight', 'normal');
					
				// select the arc and transition
				thePie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.attr('transform', 'scale(1,1)');
			});
		
		// transition all
		legendTextSelection.transition().text(me.legendTextFunction);
	},
	
	/**
	 * @function
	 * @description Handle the chart title
	 */
	handleChartTitle: function() {
		var me = this;
		
		var ct = me.chartTitle == null ? '' : me.chartTitle;
		
		me.gTitle.selectAll('text').remove();
		
		me.gTitle.selectAll('text')
			.data([ct])
			.enter()
			.append('text')
			.style('fill', '#444444')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.text(String);
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
	}
});