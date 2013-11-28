/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Generic line/area chart
 */
Ext.define('App.util.d3.LineChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
	 * canvas width, height
	 */
	canvasWidth: 400,
	canvasHeight: 400,
	
	/**
 	 * "g" elements to hold paths, X/Y axes, and title
 	 */
	gCanvas: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	/**
 	 * X and Y axis functions
 	 */
	xAxis: null,
	yAxis: null,
	
	/**
 	 * default margins
 	 */
 	margins: {
		top: 20,
		right: 10,
		bottom: 90,
		left: 90
	},
	
	/**
 	 * fillArea = true for area chart, false for line chart
 	 */
	fillArea: false,
	
	/**
	 * x/y data metrics
	 */
	xDataMetric: null,
	yDataMetric: null,
	
	/**
 	 * ticks and formats
 	 */
 	xTicks: 7,
 	yTicks: 12,
 	xTickFormat: function(d) {
		return d;
	},
 	yTickFormat: function(d) {
		return d;
	},
	
	/**
 	 * scale padding
 	 */
 	xScalePadding: 0,
 	yScalePadding: 0,
 	
 	/**
  	 * line/area holders
  	 */
  	canvasLine: null,
  	canvasArea: null,
	
	/**
 	 * misc.
 	 */
 	panelId: null,
 	chartTitle: null,
 	strokeColor: '#990066',
	fillColor: '#FFCC99',
 	
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
 	 * @memberOf App.util.d3.Scatterplot
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 */
	setXScale: function(metric) {
		var me = this;
		
		me.xScale = d3.scale.linear()
			.domain([
				d3.min(me.graphData, function(d) { return d[metric]; }),
				d3.max(me.graphData, function(d) { return d[metric]; })
			])
			.range([
				me.margins.left,
				me.canvasWidth - me.margins.right
			]);
			
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.orient('bottom')
			.ticks(me.xTicks)
			.tickFormat(me.xTickFormat);
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.Scatterplot
 	 * @description Set the vertical (y) scale
 	 * @param metric String
 	 */
	setYScale: function(metric) {
		var me = this;
		
		var yScalePadding = me.yScalePadding;
			
		me.yScale = d3.scale.linear()
			.domain([
				0,
				d3.max(me.graphData, function(d) { return d[metric] + yScalePadding })
			])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.margins.top
			]);
			

		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.orient('left')
			.ticks(me.yTicks)
			.tickFormat(me.yTickFormat);	
	},
	
	/**
 	 * @function
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
		me.gCanvas = me.svg.append('svg:g');
		me.gTitle = me.svg.append('svg:g');
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
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			xDataMetric = me.xDataMetric,
			yDataMetric = me.yDataMetric,
			margins = me.margins,
			graphData = me.graphData;
			
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			return;
		}
		
		//////////////////////////////////////////////////
		// init canvasLine
		//////////////////////////////////////////////////
		me.canvasLine = d3.svg.line()
			.x(function(d) {
				return xScale(d[xDataMetric]);
			})
			.y(function(d) {
				return yScale(d[yDataMetric]);
			});
		
		//////////////////////////////////////////////////
		// init canvasArea
		//////////////////////////////////////////////////
		me.canvasArea = d3.svg.area()
			.x(function(d) {
				return xScale(d[xDataMetric]);
			})
			.y0(me.canvasHeight - me.margins.bottom)
			.y1(function(d) {
				return yScale(d[yDataMetric]);
			});
		
		//////////////////////////////////////////////////
		// line OR area view
		//////////////////////////////////////////////////
		if(me.fillArea) {
			me.gCanvas.append('path')
				.datum(me.graphData)
				.style('fill', me.fillColor)
				.style('stroke-width', 1)
				.style('stroke', me.strokeColor)
				.attr('d', me.canvasArea);
		} else {
			me.gCanvas.append('path')
				.datum(me.graphData)
				.style('fill', 'none')
				.style('stroke-width', 1)
				.style('stroke', me.strokeColor)
				.attr('d', me.canvasLine);
		}
			
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
	},
	
	/**
 	 * @function
 	 */
 	transition: function() {
 		var me = this;

		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric);
		me.setYScale(me.yDataMetric);
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var yScale = me.yScale,
			xScale = me.xScale,
			canvasHeight = me.canvasHeight,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			graphData = me.graphData,
			xDataMetric = me.xDataMetric,
			yDataMetric = me.yDataMetric;
			
		//////////////////////////////////////////////////
		// transition area OR line
		// - rebuild area
		// - join
		// - remove
		// - add
		// - transition
		//////////////////////////////////////////////////
		if(me.fillArea) {
			me.canvasArea = d3.svg.area()
				.x(function(d) {
					return xScale(d[xDataMetric]);
				})
				.y0(me.canvasHeight - me.margins.bottom)
				.y1(function(d) {
					return yScale(d[yDataMetric]);
				});
				
			me.gCanvas.selectAll('path')
				.datum(me.graphData)
				.style('fill', me.fillColor)
				.style('stroke-width', 1)
				.style('stroke', me.strokeColor)
				.transition()
				.duration(250)
				.attr('d', me.canvasArea);
		} else {
			me.canvasLine = d3.svg.line()
				.x(function(d) {
					return xScale(d[xDataMetric]);
				})
				.y(function(d) {
					return yScale(d[yDataMetric]);
				});
				
			me.gCanvas.selectAll('path')
				.datum(me.graphData)
				.style('fill', 'none')
				.style('stroke-width', 1)
				.style('stroke', me.strokeColor)
				.transition()
				.duration(250)
				.attr('d', me.canvasLine);
		}

		//////////////////////////////////////////////////
		// re-call the X and Y axes
		//////////////////////////////////////////////////
		// transition().duration(500)
		me.gXAxis.call(me.xAxis);
		me.gYAxis.call(me.yAxis);
 	},
	
	/**
 	 * SETTERS
 	 */
 	setFillArea: function(bool) {
	 	var me = this;
	 	
	 	me.fillArea = bool;
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
	
	setXScalePadding: function(num) {
		var me = this;
		
		me.xScalePadding = num;
	},
	
	setYScalePadding: function(num) {
		var me = this;
		
		me.yScalePadding = num;
	},
	
	setFillColor: function(color) {
		var me = this;
		
		me.fillColor = color;
	},
	
	setStrokeColor: function(color) {
		var me = this;
		
		me.strokeColor = color;
	}
});