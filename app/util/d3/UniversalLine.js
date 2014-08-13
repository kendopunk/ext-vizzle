
Ext.define('App.util.d3.UniversalLine', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * other configs
 	 */
	canvasWidth: 400,
	canvasHeight: 400,
	
	canvasArea: null,
	canvasLine: null,  	
	chartInitialized: false,
	chartTitle: null,
	defs: null,
	eventRelay: null,
	fillArea: false,
	fillColor: '#FFFFCC',
	filter: null,
	
	gCanvas: null,
	gError: null,
	gLabel: null,
	gMarker: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	gGrid: null,
	
	handleEvents: false,
	interpolate: 'linear',
		// linear, step-before, step-after, basis, basis-open, basis-closed,
		// bundle, cardinal, cardinal-open, cardinal-closed, monotone
	labelClass: 'labelText',
	labelSkipCount: 1,		// every 2nd, 3rd, 4th, etc.
	labelFunction: function(data, index) {
		return 'label';
	},
	margins: {
		top: 20,
		right: 10,
		bottom: 90,
		left: 90
	},
	markerFillColor: '#FFCC33',
	markerRadius: 4,
	markerStrokeColor: '#333333',
	markerStrokeWidth: 1,
	mouseEvents: {
 		mouseover: {
	 		enabled: false,
	 		eventName: null
	 	},
	 	mouseout: {
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
	noDataMessage: 'No data to display',
	panelId: null,
	pathStroke: '#0000FF',
	pathStrokeWidth: 1,
	showLabels: true,
	showGrid: true,
	showMarkers: true,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	// x stuff
	xAxis: null,
	xLabelRotation: 'horizontal', // horizontal | vertical | fortyfive
	xDataMetric: null,
	xTicks: 10,
	xTickFormat: function(d) {
		return d;
	},
	xTickValues: false,
	xScalePadding: 0,		// not used (ordinal scale) ?? @TODO 
	// y stuff
	yAxis: null,
	yDataMetric: null,
	yTicks: 8,
	yTickFormat: function(d) {
		return d;
	},
	yScalePadding: 0,
	
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
	},
	
	/**
 	 * @function
 	 * @description Initialize chart components
 	 * @return this
 	 */
 	initChart: function() {
 		var me = this;
 		
 		var xAxTrans = me.canvasHeight - me.margins.bottom;
 		
 		//////////////////////////////////////////////////
		// set "g" elements
		//////////////////////////////////////////////////
		me.gCanvas = me.svg.append('svg:g');
		me.gLabel = me.svg.append('svg:g');
		me.gMarker = me.svg.append('svg:g');
		me.gGrid = me.svg.append('svg:g');
		me.gXAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + xAxTrans + ')');
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.left + ', 0)');
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
				+ Math.floor(me.canvasWidth/2)
				+ ','
				+ Math.floor(me.margins.top/2)
				+ ')'
			);
		me.gError = me.svg.append('svg:g')
			.attr('transform', 'translate('
				+ Math.floor(me.canvasWidth/2)
				+ ','
				+ Math.floor(me.canvasHeight/2)
				+ ')');
			
		//////////////////////////////////////////////////
		// defs
		//////////////////////////////////////////////////
		me.defs = me.svg.append('defs');
		
		me.filter = me.defs.append('filter')
			.attr('id', 'def_' + me.panelId)
			.attr('x', '-40%')
			.attr('y', '-40%')
			.attr('height', '200%')
			.attr('width', '200%');
		
		// append Gaussian blur to filter
		me.filter.append('feGaussianBlur')
			.attr('in', 'SourceAlpha')
			.attr('stdDeviation', 3) // !!! important parameter - blur
			.attr('result', 'blur');
			
		// append offset filter to result of Gaussian blur filter
		me.filter.append('feOffset')
			.attr('in', 'blur')
			.attr('dx', 2) // !!! important parameter - x-offset
			.attr('dy', 2) // !!! important parameter - y-offset
			.attr('result', 'offsetBlur');
			
		// merge result with original image
		var feMerge = me.filter.append('feMerge');
		
		// first layer result of blur and offset
		feMerge.append('feMergeNode')
			.attr('in", "offsetBlur');
			
		// original image on top
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');
		
		//////////////////////////////////////////////////
		// outta here
		//////////////////////////////////////////////////
 		me.chartInitialized = true;
 		
 		return me;
 	},
	
	/**
 	 * @function
 	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check (1)
		//////////////////////////////////////////////////
		if(me.svg == null || me.xDataMetric == null || me.yDataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		me.setLineAreaFn();
		
		//////////////////////////////////////////////////
		// HANDLERS
		// - paths
		// - labels
		// - markers
		// - title
		// - axes
		//////////////////////////////////////////////////
		me.handlePaths();
		me.handleLabels();
		me.handleMarkers();
		me.handleChartTitle();
		me.handleGrid(),
		me.callAxes();
		me.noDataHandler();
		
		me.printOptimize();
	},
	
	/**
 	 * @function
 	 * @description Generate/regenerate the data paths
 	 */
	handlePaths: function() {
		var me = this;
		
		////////////////////////////////////////
		// local scope
		////////////////////////////////////////
		var canvasArea = me.canvasArea,
			canvasLine = me.canvasLine,
			fillColor = me.fillColor,
			fillArea = me.fillArea;
			
		var pathSelectionCheck = me.gCanvas.selectAll('path');
		
		// nothing
		if(pathSelectionCheck[0].length == 0) {
			me.gCanvas.append('path')
				.datum(me.graphData)
				.style('fill', function(d) {
					if(fillArea) {
						return me.fillColor;
					}
					return 'none'
				})
				.style('stroke', me.pathStroke)
				.style('stroke-width', me.pathStrokeWidth)				
				.attr('d', function(d, i) {
					if(fillArea) {
						return canvasArea(d, i);
					}
					return canvasLine(d, i);
				});
		} else {
			me.gCanvas.selectAll('path')
				.datum(me.graphData)
				.style('fill', function(d) {
					if(fillArea) {
						return fillColor;
					}
					return 'none'
				})
				.style('stroke', me.pathStroke)
				.style('stroke-width', me.pathStrokeWidth)				
				.transition()
				.duration(250)
				.attr('d', function(d, i) {
					if(fillArea) {
						return canvasArea(d, i);
					}
					return canvasLine(d, i);
				});
		}
	},
 	
 	/**
  	 * @function
  	 * @description Handle labels
  	 */
  	handleLabels: function() {
  		var me = this;
  		
  		// extinguish (kesu)
  		if(!me.showLabels) {
	  		me.gLabel.selectAll('text').remove();
	  		return;
	  	}
  		
  		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric,
  			markerRadius = me.markerRadius,
  			labelSkipCount = me.labelSkipCount;
  			
  		// join new with old
  		var labelSelection = me.gLabel.selectAll('text')
	  		.data(me.graphData);
	  		
	  	// transition out old
	  	labelSelection.exit()
		  	.transition()
		  	.duration(250)
		  	.attr('x', -200)
		  	.remove();
		
		// add new
		labelSelection.enter()
			.append('text')
			.attr('class', me.labelClass)
			.attr('text-anchor', 'start');
			
		// transition all
		labelSelection.transition()
			.duration(250)
			.attr('x', function(d, i) {
				return xScale(d[xDataMetric]) - (markerRadius * 4);
			})
			.attr('y', function(d) {
				return yScale(d[yDataMetric]) - (markerRadius * 3);
			})
			.text(function(d, i) {
				if(labelSkipCount > 1) {
					if(i> 0 && i % labelSkipCount == 0) {
						return me.labelFunction(d, i);
					}
					return '';
				} else {
					return me.labelFunction(d, i);
				}
			});
  	},
  	
 	/**
  	 * @function
  	 * @description Handle the circle markers on the paths
  	 */
  	handleMarkers: function() {
  		var me = this;
  		
  		// extinguish (kesu)
  		if(!me.showMarkers) {
  			me.gMarker.selectAll('circle').remove();
  			return;
  		}
  		
  		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric,
  			markerRadius = me.markerRadius;
  			
  		// join new with old
  		var markerSelection = me.gMarker.selectAll('circle')
	  		.data(me.graphData);
	  		
	  	// transition out old
	  	markerSelection.exit()
		  	.transition()
		  	.duration(250)
		  	.attr('width', 0)
		  	.remove();
		  	
		// add new
		markerSelection.enter()
			.append('circle')
			.attr('filter', 'url(#def_' + me.panelId + ')')
			.on('mouseover', function(d, i) {
				d3.select(this).transition().duration(0).attr('r', function() {
					return markerRadius * 3;
				});
				
				me.publishMouseEvent('mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.transition()
					.duration(250)
					.attr('r', markerRadius)
					.ease('bounce');
					
				me.publishMouseEvent('mouseout', d, i);
			});
			
		// transition all
		markerSelection.transition()
			.duration(250)
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			})
			.attr('r', me.markerRadius)
			.style('fill', me.markerFillColor)
			.style('stroke', me.markerStrokeColor)
			.style('stroke-width', me.markerStrokeWidth);
		
		// call the tooltip helper
		markerSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	handleGrid: function() {
		var me = this;
		
		// NO GRID !!
		if(!me.showGrid) {
			me.gGrid.selectAll('.vertGrid')
				.transition()
				.duration(250)
				.attr('y1', me.canvasHeight)
				.remove();
				
			me.gGrid.selectAll('.hozGrid')
				.transition()
				.duration(250)
				.attr('x1', 0)
				.remove();
				
			return;
		}
		
		var xScale = me.xScale,
			xDataMetric = me.xDataMetric,
			yScale = me.yScale,
			yDataMetric = me.yDataMetric;
			
		//////////////////////////////////////////////////
		// VERTICAL JRAT
		//////////////////////////////////////////////////
		var verticalSelection = me.gGrid.selectAll('.vertGrid')
			.data(me.graphData);
			
		verticalSelection.exit().remove();
		
		verticalSelection.enter()
			.append('svg:line')
			.attr('class', 'vertGrid')
			.style('stroke', '#BBBBBB')
			.style('stroke-width', 1)
			.style('stroke-dasharray', ("7,3"));
			
		verticalSelection.transition()
			.duration(500)
			.attr('x1', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('x2', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('y1', function(d) {
				return me.margins.top;
			})
			.attr('y2', me.canvasHeight - me.margins.bottom);
			
		//////////////////////////////////////////////////
		// HORIZONTAL JRAT
		// we're NOT binding graph data to this...we are 
		// binding the tick array from the Y scale
		//////////////////////////////////////////////////
		var horizontalSelection = me.gGrid.selectAll('.hozGrid')
			.data(me.yScale.ticks());
		
		horizontalSelection.exit().remove();
		
		horizontalSelection.enter()
			.append('svg:line')
			.attr('class', 'hozGrid')
			.style('stroke', '#BBBBBB')
			.style('stroke-width', 1)
			.style('stroke-dasharray', ("7,3"));
			
		horizontalSelection.transition()
			.duration(500)
			.attr('x1', me.margins.left)
			.attr('x2', me.canvasWidth - me.margins.right)
			.attr('y1', function(d, i) {
				return yScale(d);
			})
			.attr('y2', function(d, i) {
				return yScale(d);
			})
			.attr('display', function(d, i) {
				return i == 0 ? 'none' : null;
			});
	},
	
 	/**
  	 * @function
  	 * @description Handle generation/transition of the chart title
  	 */
 	handleChartTitle: function() {
 		var me = this;
 		
 		me.gTitle.selectAll('text').remove();
 		
 		if(me.chartTitle != null) {
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
 	 * @description Call the X/Y axes generation/transition functions
 	 */
 	callAxes: function() {
	 	var me = this;
	 	
	 	var rot = me.xLabelRotation;
	 	
	 	// Y
	 	me.gYAxis.call(me.yAxis);
	 	
	 	// X
	 	me.gXAxis.call(me.xAxis)
		 	.selectAll('text')
		 	.style('text-anchor', function(d) {
			 	if(rot == 'horizontal') {
				 	return 'middle';
				}
				return 'end';
			})
			.attr('transform', function() {
				if(rot == 'fortyfive') {
					return 'rotate(-45)translate(-8,-5)';
				} else if(rot == 'vertical') {
					return 'rotate(-90)translate(-10,-13)';
				} else {
					return 'translate(0,3)';
				}
			});
	},
	
	/**
 	 * @function
 	 * @description No data handler
 	 */
 	noDataHandler: function() {
	 	var me = this;
	 	
	 	/*App.util.Global.svg.clearNoResultsImage(me.gError);
	 	
	 	if(me.graphData.length == 0) {
		 	App.util.Global.svg.noResultsImage(me.gError, me.canvasWidth, me.canvasHeight, me.noDataMessage);
		}*/
	},
	
	/**
  	 * @function
  	 * @description Simultaneously setting the line and area functions
  	 */
 	setLineAreaFn: function() {
	 	var me = this;
	 	
	 	var xScale = me.xScale,
		 	xDataMetric = me.xDataMetric,
	 		yDataMetric = me.yDataMetric,
	 		yScale = me.yScale;

		me.canvasLine = d3.svg.line()
			.interpolate(me.interpolate)
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y(function(d) { return yScale(d[yDataMetric]); });
			
		me.canvasArea = d3.svg.area()
			.interpolate(me.interpolate)
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y0(me.canvasHeight - me.margins.bottom)
			.y1(function(d) { return yScale(d[yDataMetric]); });
	},
	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalLine
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 */
	setXScale: function(metric) {
		var me = this,
			tickValues = null;
			
		if(me.xTickValues) {
			tickValues = [];
			Ext.each(me.graphData, function(gd) {
				tickValues.push(gd[metric]);
			});
		}
		
		me.xScale = d3.scale.linear()
			.domain([
				d3.min(me.graphData, function(d) { return d[metric]; }),
				d3.max(me.graphData, function(d) { return d[metric]; })
			])
			.range([me.margins.left, me.canvasWidth - me.margins.right]);

		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.orient('bottom')
			.tickValues(tickValues)	// array or null
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalLine
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 */
	setYScale: function(metric) {
		var me = this;
		
		var yScalePadding = me.yScalePadding;
			
		me.yScale = d3.scale.linear()
			.domain([
				0,
				d3.max(me.graphData, function(d) { 
					if(yScalePadding > 0) {
						return d[metric] + (d[metric] * yScalePadding);
					}
					return d[metric];
				})
			])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.margins.top
			]);
			
		var useYTicks = me.yTicks,
			gdMax = d3.max(me.graphData, function(d) { return d[metric];});
		
			
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.orient('left')
			.ticks(Ext.Array.min([gdMax, useYTicks]))
			.tickFormat(me.yTickFormat);	
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
 	 * @function
 	 * @description Print optimization (axes)
 	 */
	printOptimize: function() {
		var me = this;
		
		me.svg.selectAll('.axis line, .axis path')
			.style({
				'stroke': 'black',
				'fill': 'none',
				'stroke-width': '1px'
			});
	},
	
	/**
 	 * SETTERS
 	 */
 	setChartTitle: function(title) {
		var me = this;
		me.chartTitle = title;
	},
	
 	setFillArea: function(bool) {
	 	var me = this;
	 	me.fillArea = bool;
	},
	
	setFillColor: function(color) {
		var me = this;
		me.fillColor = color;
	},
	
	setGraphData: function(data) {
		var me = this;
		me.graphData = data;
	},
	
	setInterpolation: function(interp) {
		var me = this;
		me.interpolate = interp;
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		me.labelFunction = fn;
	},
	
	setLabelSkipCount: function(count) {
		var me = this;
		me.labelSkipCount = count;
	},
	
	setMarkerFillColor: function(color) {
		var me = this;
		me.markerFillColor = color;
	},
	
	setPathStroke: function(color) {
		var me = this;
		me.pathStroke = color;
	},
	
	setPathStrokeWidth: function(w) {
		var me = this;
		me.pathStrokeWidth = w;
	},
	
	setShowGrid: function(bool) {
		var me = this;
		me.showGrid = bool;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		me.showLabels = bool;
	},

	setTooltipFunction: function(fn) {
		var me = this;
		me.tooltipFunction = fn;
	},
	
	setXDataMetric: function(metric) {
		var me = this;
		me.xDataMetric = metric;
	},
	
	setXScalePadding: function(num) {
		var me = this;
		me.xScalePadding = num;
	},
	
	setXTickFormat: function(fn) {
		var me = this;
		me.xTickFormat = fn;
	},
	
	setYDataMetric: function(metric) {
		var me = this;
		me.yDataMetric = metric;
	},

	setYTickFormat: function(fn) {
		var me = this;
		me.yTickFormat = fn;
	},
	
	setYScalePadding: function(num) {
		var me = this;
		me.yScalePadding = num;
	}
});