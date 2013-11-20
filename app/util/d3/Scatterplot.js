/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Generic scatterplot class
 */
Ext.define('App.util.d3.Scatterplot', {
	
	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * The "g" elements to hold scatterplot points,
 	 * text, axes and titles
 	 */
	gScatter: null,
	gLabel: null,
	gText: null,
	gXAxis: null,
 	gYAxis: null,
 	gTitle: null,
	
	/**
	 * Overall height of the drawing canvas.  This should be passed
	 * as a configuration item
	 */
	canvasHeight: 400,
	
	/**
	 * Overal width of the drawing canvas. Should be passed as a configuration
	 * item
	 */
	canvasWidth: 400,
	
	/**
	 * An array of data objects for the graph
	 */
	graphData: [],
	
	/**
 	 * 
 	 */
 	xDataMetric: null,
 	yDataMetric: null,
	
	/**
 	 * The ExtJS panel ID in which the drawing is rendered
 	 */
	panelId: null,
	
	/**
	 * Show bar graph labels.  TODO: Customize placement of labels
	 */
	showLabels: false,
	labelFontSize: 9,
	labelDistanceFromBar: 10,	// needs to be less than labelOffsetTop
	
	/**
 	 * Default margins for the drawing
 	 */
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 90
	},
	
	/**
 	 * color scale
 	 */
	colorScaleFunction:  function(data, index) {
		return '#333333';
	},
	
	/**
 	 * desired increments for Y axis
 	 */
 	desiredYIncrements: null,
	
	/**
	 * default ticks and tick formats
	 */
	xTicks: 10,
	xTickFormat: function(d) {
		return Ext.util.Format.number(d, '0,000');
	},
	yTicks: 10,
	yTickFormat: function(d) {
		return Ext.util.Format.number(d, '0,000');
	},
	
	/**
 	 * Scales and Axes and Scale Padding
 	 */
 	xScale: null,
 	yScale: null,
 	xScalePadding: 0,
 	
 	xAxis: null, 	// fn()
 	yAxis: null, 	// fn()
 	yScalePadding: 0,
 	
 	/**
  	 * X and Y scaled to 0 as the min, by default
  	 */
  	scaleToZero: false,
 	
 	/**
  	 * misc.
  	 */
  	radius: 3,
	
	/**
 	 * chart title configs
 	 */
 	chartTitle: null,
 	showChartTitle: false,
	
	/**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * Default function for rendering a label
 	 */
 	labelFunction: function(data, index) {
	 	return 'label';
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
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 */
	setXScale: function(metric) {
		var me = this;
		
		var xScalePadding = me.xScalePadding,
			domainMin = 0;
		
		if(!me.scaleToZero) {
			var domainMin = d3.min(me.graphData, function(d) {
				return d[metric] - xScalePadding;
			});
		}
		
		me.xScale = d3.scale.linear()
			.domain([
				domainMin,
				d3.max(me.graphData, function(d) { return d[metric] + xScalePadding; })
			])
			.range([
				me.margins.left,
				me.canvasWidth - me.margins.right
			]);
			
		var workingXAxisScale = d3.scale.linear()
			.domain([
				domainMin,
				d3.max(me.graphData, function(d) { return d[metric] + xScalePadding; })
			])
			.range([
				me.margins.left,
				me.canvasWidth - me.margins.right
			]);
			
		me.xAxis = d3.svg.axis()
			.scale(workingXAxisScale)
			.orient('bottom')
			.ticks(10)
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 */
	setYScale: function(metric) {
		var me = this;
		
		var yScalePadding = me.yScalePadding,
			domainMin = 0;
		
		if(!me.scaleToZero) {
			domainMin = d3.min(me.graphData, function(d) {
				return d[metric] - yScalePadding;
			});
		}
		
		me.yScale = d3.scale.linear()
			.domain([
				domainMin,
				d3.max(me.graphData, function(d) { return d[metric] + yScalePadding })
			])
			.range([
				me.canvasHeight - me.margins.top,
				me.margins.bottom
			]);
			
		var workingYAxisScale = d3.scale.linear()
			.domain([
				domainMin,
				d3.max(me.graphData, function(d) { return d[metric] + yScalePadding; })
			])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.canvasHeight - (me.canvasHeight - me.margins.top)
			])
			
		me.yAxis = d3.svg.axis()
			.scale(workingYAxisScale)
			.orient('left')
			.ticks(me.yTicks)
			.tickFormat(me.yTickFormat);	
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Draw the initial bar chart
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.svg == null || me.xDataMetric == null || me.yDataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// set "g" elements
		//////////////////////////////////////////////////
		me.gScatter = me.svg.append('svg:g');
		me.gText = me.svg.append('svg:g');
		me.gLabel = me.svg.append('svg:g');
		me.gXAxis = me.svg.append('svg:g');
		me.gYAxis = me.svg.append('svg:g');
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		
		//////////////////////////////////////////////////
		// bring ExtJS variables
		// into local scope for use in D3
		//////////////////////////////////////////////////
		var xScale = me.xScale,
			xAxis = me.xAxis,
			yScale = me.yScale,
			yAxis = me.yAxis,
			radius = me.radius,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			xDataMetric = me.xDataMetric,
			yDataMetric = me.yDataMetric,
			margins = me.margins,
			graphData = me.graphData,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents,
			labelDistanceFromBar = me.labelDistanceFromBar;
			
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			return;
		}
		
		//////////////////////////////////////////////////
		// draw the circles
		//////////////////////////////////////////////////
		me.gScatter.selectAll('circle')
			.data(me.graphData)
			.enter()
			.append('circle')
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			})
			.attr('r', me.radius)
			.style('fill', me.colorScaleFunction)
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d, i) {
				
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			});
			
		//////////////////////////////////////////////////
		// construct labels, if applicable
		//////////////////////////////////////////////////
		if(me.showLabels) {
			me.gLabel.selectAll('text')
				.data(me.graphData)
				.enter()
				.append('text')
				.style('font-size', me.labelFontSize)
				.attr('x', function(d) {
					return xScale(d[xDataMetric]) + radius + 2;
				})
				.attr('y', function(d) {
					return yScale(d[yDataMetric]) - radius;
				})
				.attr('text-anchor', 'start')
				.text(me.labelFunction);
		}

		//////////////////////////////////////////////////
		// call the X-axis
		//////////////////////////////////////////////////
		var xAxTrans = canvasHeight - margins.bottom;
		me.gXAxis.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + xAxTrans + ')')
			.call(xAxis);
			
		//////////////////////////////////////////////////
		// call the Y-axis
		//////////////////////////////////////////////////	
		me.gYAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.left + ', 0)')
			.call(yAxis);
			
		//////////////////////////////////////////////////
		// chart title
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(function(d) {
					return d;
				});
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.BarChart
 	 * @description Transition the bar chart
 	 */
	transition: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		
		/*var metric = me.dataMetric;
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale(metric);
		me.setYAxisScale(metric);
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var yScale = me.yScale,
			xScale = me.xScale,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			barPadding = me.barPadding,
			labelDistanceFromBar = me.labelDistanceFromBar,
			colorScale = me.colorScale,
			graphData = me.graphData,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseEvents = me.mouseEvents;
			
		//////////////////////////////////////////////////
		// bars: join new data with old data
		//////////////////////////////////////////////////
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
		
		//////////////////////////////////////////////////
		// transition out old bars
		//////////////////////////////////////////////////
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		//////////////////////////////////////////////////
		// add new bars
		//////////////////////////////////////////////////
		var newBars = rectSelection.enter()
			.append('rect')
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.style('stroke', '#333333')
			.style('stroke-width', 1);
		
		//////////////////////////////////////////////////
		// apply the events
		//////////////////////////////////////////////////
		rectSelection.on('mouseover', function(d, i) {
				if(handleEvents && eventRelay && mouseEvents.mouseover.enabled) {
					eventRelay.publish(mouseEvents.mouseover.eventName, {
						payload: d,
						index: i
					});
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			})
			.call(d3.helper.tooltip().text(me.tooltipFunction));
		
		//////////////////////////////////////////////////
		// transition rectangles
		//////////////////////////////////////////////////
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function(d) {
				return canvasHeight - yScale(d[metric]);
			})
			.attr('width', function(d) {
				return (canvasWidth - (margins.left + margins.right))/graphData.length - barPadding;
			})
			.attr('height', function(d) {
				return yScale(d[metric]) - margins.bottom;
			})
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			
		//////////////////////////////////////////////////
		// transition labels
		//////////////////////////////////////////////////
		if(me.showLabels) {
			// join
			var labelSelection = me.gText.selectAll('text')
				.data(me.graphData);

			// remove
			labelSelection.exit().remove();
			
			// new labels
			var newLabels = labelSelection.enter()
				.append('text')
				.style('font-size', me.labelFontSize)
				.attr('textAnchor', 'start');
				
			// transition all
			labelSelection.transition()
				.duration(250)
				.attr('x', function(d, i) {
					return xScale(i);
				})
				.attr('y', function(d) {
					return canvasHeight - yScale(d[metric]) - labelDistanceFromBar;
				})
				.text(me.labelFunction);	
		} else {
			me.gText.selectAll('text')
				.transition()
				.duration(250)
				.attr('x', -100)
				.remove();
		}
		
		//////////////////////////////////////////////////
		// TITLE
		//////////////////////////////////////////////////
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.text(me.chartTitle);
		}
		
		//////////////////////////////////////////////////
		// re-call they y axis function
		//////////////////////////////////////////////////
		me.svg.selectAll('g.axis').transition().duration(500).call(me.yAxis);
		*/
	},
	
	/**
 	 * SETTERS
 	 */
 	 
 	setColorScaleFunction: function(fn) {
	 	var me = this;
	 	
	 	me.colorScaleFunction = fn;
	},
	
	setXDataMetric: function(metric) {
		var me = this;
		
		me.xDataMetric = metric;
	},
	
	setYDataMetric: function(metric) {
		var me = this;
		
		me.yDataMetric = metric;
	},
	
	setXTickFormat: function(fn) {
		var me = this;
		
		me.xTickFormat = fn;
	},
	
	setYTickFormat: function(fn) {
		var me = this;
		
		me.yTickFormat = fn;
	},
	
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	},
	
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		
		me.showLabels = bool;
	},
	
	setScaleToZero: function(bool) {
		var me = this;
		
		me.scaleToZero = bool;
	}
});