/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly customizable, responsive timeline plotter
 */
Ext.define('App.util.d3.UniversalTimeline', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	/**
	 * other configs
	 */
	canvasHeight: 400,
	canvasWidth: 400,
	chartInitialized: false,
	chartTitle: null,
	colorScale: d3.scale.category20(),
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	dateProperty: 'dates',
	eventRelay: null,
	
	// "g"
	gBar: null,
	gGrid: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	graphData: [],
	handleEvents: false,
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 100,
		leftAxis: 90
	},
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
	orientation: 'horizontal',
	panelId: null,
	showGrid: true,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	xAxis: null,
	xScale: null,
	xTickFormat: function(d) {
		return d;
	},
	
	yAxis: null,
	yDataMetric: 'name',
	yScale: null,
	
	/**
 	 * init
 	 */
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
 	 */
	initChart: function() {
		var me = this;
		
		var xAxTrans = me.canvasHeight - me.margins.bottom;
		
		////////////////////////////////////////
		// "g" elements
		////////////////////////////////////////
		me.gBar = me.svg.append('svg:g');
		
		me.gGrid = me.svg.append('svg:g');
		
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
			
		me.gXAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(0, ' + xAxTrans + ')');
			
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.left + ', 0)');
		
		// bool
		me.chartInitialized = true;

		return me;
	},
	
	/**
 	 * @function
 	 * @description Draw/redraw the chart
 	 */
 	draw: function() {
	 	var me = this;
	 	
	 	////////////////////////////////////////
	 	// set scales
	 	////////////////////////////////////////
	 	me.setXScale();
	 	me.setYScale();
	 	
	 	//////////////////////////////////////////////////
		// HANDLERS
		//////////////////////////////////////////////////
		me.handleGrid();
		me.handleBars();
		me.handleChartTitle();
		me.callAxes();
 	},
 	
 	/**
  	 * @function
  	 * @description Handle all the bars
  	 */
  	handleBars: function() {
	  	var me = this,
		  	normalized = [];
		  	
		// local scope
		var canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			xScale = me.xScale,
			yScale = me.yScale,
			yDataMetric = me.yDataMetric,
			normalizedData = me.normalizeChartData(),
			colorDefinedInData = me.colorDefinedInData,
			colorDefinedInDataIndex = me.colorDefinedInDataIndex;
	  	
	  	////////////////////////////////////////
	  	// RECTANGLES - JRAT
	  	////////////////////////////////////////
	  	var rectSelection = me.gBar.selectAll('rect')
		  	.data(normalizedData);
		  	
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		// add new bars
		rectSelection.enter()
			.append('rect')
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {	
				d3.select(this).style('opacity', .6)
					.style('stroke', 'red');
			})
			.on('mouseout', function(d, i) {
				d3.select(this).style('opacity', 1)
					.style('stroke', 'black');
			});
		
		// transition all rectangles
		rectSelection.transition()
			.duration(500)
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('x', function(d, i) {
				return xScale(d.datePair[0].getTime());
			})
			.attr('y', function(d) {
				return yScale(d[yDataMetric]);
			})
			.attr('width', function(d) {
				return xScale(d.datePair[1].getTime()) - xScale(d.datePair[0].getTime());
			})
			.attr('height', function(d) {
				return yScale.rangeBand() * .7;
			})
			.attr('transform', function(d, i) {
				// range band minus rangeBandReduction divided  by 2
				var tr = (yScale.rangeBand() - (yScale.rangeBand() * .7))/2;
				return 'translate(0,' + tr + ')';
			})
			.attr('fill', function(d, i) {
				if(colorDefinedInData) {
					return d[colorDefinedInDataIndex];
				}
				return me.colorScale(i);
			});
			
		// tooltips
		rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
 	
 	/**
	 * @function
	 * @description Handle marker lines / guidelines
	 */
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
			yScale = me.yScale,
			yDataMetric = me.yDataMetric;
			
		// we're NOT binding graph data to the horizontal and vertical lines, we're
		// binding the tick arrays from the X and Y scales
			
		//////////////////////////////////////////////////
		// VERTICAL JRAT
		//////////////////////////////////////////////////
		var verticalSelection = me.gGrid.selectAll('.vertGrid')
			.data(me.xScale.ticks());
			
		verticalSelection.exit().remove();
		
		verticalSelection.enter()
			.append('svg:line')
			.attr('class', 'vertGrid')
			.style('stroke', '#878787')
			.style('stroke-width', 0.5)
			.style('stroke-dasharray', ("7,3"));
			
		verticalSelection.transition()
			.duration(500)
			.attr('x1', function(d) {
				return xScale(d);
			})
			.attr('x2', function(d) {
				return xScale(d);
			})
			.attr('y1', function(d) {
				return me.margins.top;
			})
			.attr('y2', me.canvasHeight - me.margins.bottom);
			
		//////////////////////////////////////////////////
		// HORIZONTAL JRAT
		//////////////////////////////////////////////////
		var horizontalSelection = me.gGrid.selectAll('.hozGrid')
			.data(me.graphData);
		
		horizontalSelection.exit().remove();
		
		horizontalSelection.enter()
			.append('svg:line')
			.attr('class', 'hozGrid')
			.style('stroke', '#878787')
			.style('stroke-width', 0.5)
			.style('stroke-dasharray', ("7,3"));
			
		horizontalSelection.transition()
			.duration(500)
			.attr('x1', me.margins.left)
			.attr('x2', me.canvasWidth - me.margins.right)
			.attr('y1', function(d, i) {
				return yScale(d[yDataMetric]) + Math.floor(yScale.rangeBand()/2);
			})
			.attr('y2', function(d, i) {
				return yScale(d[yDataMetric]) + Math.floor(yScale.rangeBand()/2);
			});
	},
	
	/**
 	 * @function
 	 * @description Normalize chart data
 	 */
 	normalizeChartData: function() {
	 	var me = this,
		 	ret = [];
		 	
		Ext.each(me.graphData, function(item) {
			var obj = {};
			
			Ext.iterate(item, function(k, v) {
				if(k !== me.dateProperty) {
					obj[k] = v;
				}
			});
			
			Ext.each(item[me.dateProperty], function(dateEntry) {
				var temp = Ext.clone(obj);
				
				temp.datePair = dateEntry;
				
				ret.push(temp);
			}, me);
		}, me);
	  	
	  	return ret;
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
				.style('fill', '#878787')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	},
	
 	/**
	 * @function
	 * @description Call the X/Y axes
	 */
	callAxes: function() {
		var me = this;
		
		me.gXAxis.transition().duration(500).call(me.xAxis);
		me.gYAxis.transition().duration(500).call(me.yAxis);
	},
 	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalTimeline
 	 * @description Set the horizontal scale (based on date)
 	 */
 	setXScale: function() {
	 	var me = this,
	 		tickValues = [];
	 	
	 	// pull unique dates
	 	var uniqueDates = Ext.Array.flatten(Ext.pluck(me.graphData, me.dateProperty));
	 	
	 	// run through unique dates
	 	/*
	 		if(me.xTickValues) {
				tickValues = [];
				Ext.each(me.graphData, function(gd) {
					tickValues.push(gd[metric]);
				});
			}
		}*/

		// calculate min/max dates for overall set
	 	var minDate = d3.min(uniqueDates, function(d) {
		 	return d.getTime();
		});
		var maxDate = d3.max(uniqueDates, function(d) {
			return d.getTime();
		});
		
		// generate x scale / axis
		me.xScale = d3.scale.linear()
			.domain([minDate, maxDate])
			.range([me.margins.left, me.canvasWidth - me.margins.right]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(1)
			.tickPadding(6)
			.tickFormat(me.xTickFormat)
			.orient('bottom');
	},
 	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.UniversalTimeline
 	 * @description Set the vertical (y) scale based on the yDataMetric value
 	 */
	setYScale: function() {
		var me = this,
			uniqueIds = [];
			
		uniqueIds = me.graphData.map(function(item) {
			return item[me.yDataMetric];
		}, me);
		
		me.yScale = d3.scale.ordinal()
			.domain(uniqueIds)
			.rangeRoundBands([
				me.canvasHeight - me.margins.bottom,
				me.margins.top
			]);

		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.tickSize(1)
			.tickPadding(20)
			.orient('left');	
	},
	
	/**
	 *
	 * SETTERS
	 *
	 */
	setChartTitle: function(t) {
		var me = this;
		me.chartTitle = t;
	},
	
	setGraphData: function(d) {
		var me = this;
		me.graphData = d;
	}
});