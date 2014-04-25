/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Multiple line/series chart
 */
Ext.define('App.util.d3.final.MultiLineChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	svgInitialized: false,
	dataBin: [],
	
	canvasWidth: 400,
	canvasHeight: 400,
	
	gCanvas: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	currentMinX: null,
	currentMaxX: null,
	currentMinY: null,
	currentMaxY: null,

	margins: {
		top: 20,
		right: 10,
		bottom: 90,
		left: 90
	},
	panelId: null,
	chartTitle: '',
 	strokeColor: '#0000FF',
	fillColor: '#FFFFCC',
	interpolate: 'linear',
		// linear, step-before, step-after, basis, basis-open, basis-closed,
		// bundle, cardinal, cardinal-open, cardinal-closed, monotone
		
	showLabels: true,
	labelClass: 'labelText',
	labelSkipCount: 1,		// every 2nd, 3rd, 4th, etc.
	labelFunction: function(data, index) {
		return 'label';
	},
	
	showMarkers: true,
	markerRadius: 4,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	// x stuff
	xAxis: null,
	xDataMetric: null,
	xTicks: 7,
	xTickFormat: function(d) {
		return d;
	},
	xScalePadding: 0,
	
	// y stuff
	yAxis: null,
	yDataMetric: null,
	yTicks: 12,
	yTickFormat: function(d) {
		return d;
	},
	yScalePadding: 0,
	
 	/**
  	 * line/area holders
  	 */
  	canvasLine: null,
  	canvasArea: null,
	
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
 	 * @description Initialize chart, if applicable, and append a
 	 * series to it
 	 * @param data Object[]
 	 */
	appendSeries: function(data) {
		var me = this;
		
		////////////////////////////////////////
		// sanity check (1)
		////////////////////////////////////////
		if(me.svg == null || me.xDataMetric == null || me.yDataMetric == null) {
			Ext.Msg.alert('Configuration Error', 
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		//////////////////////////////////////////////////
		// set "g" elements
		//////////////////////////////////////////////////
		if(!me.svgInitialized) {
			me.gCanvas = me.svg.append('svg:g');
			me.gXAxis = me.svg.append('svg:g');
			me.gYAxis = me.svg.append('svg:g');
			me.gTitle = me.svg.append('svg:g')
				.attr('transform', 'translate('
					+ parseInt(me.canvasWidth/2)
					+ ','
					+ parseInt(me.margins.top/2)
					+ ')');
					
			me.handleChartTitle();
		}
					
		//////////////////////////////////////////////////
		// set scales
		//////////////////////////////////////////////////
		me.setXScale(me.xDataMetric, data);
		me.setYScale(me.yDataMetric, data);
		me.setLineAreaFn();
		
		//////////////////////////////////////////////////
		// need to transition existing "g->series" elements
		//////////////////////////////////////////////////
		me.transitionExisting();
		
		//////////////////////////////////////////////////
		//
		// append the new series data
		//
		//////////////////////////////////////////////////
		var seriesG = me.gCanvas.append('svg:g')
			.attr('class', 'series'),
			randomHexColor = me.generateRandomHexColor();
			
		seriesG.append('path')
			.datum(data)
			.style('fill', 'none')
			.style('stroke-width', 1)
			.style('stroke', '#' + randomHexColor)
			.attr('d', me.canvasLine);
			
		me.appendMarkers(seriesG, data);

		//////////////////////////////////////////////////
		// axis modifications
		//////////////////////////////////////////////////
		if(!me.svgInitialized) {
			var xAxTrans = me.canvasHeight - me.margins.bottom;
			me.gXAxis.attr('class', 'axis')
				.attr('transform', 'translate(0, ' + xAxTrans + ')');
			me.gYAxis.attr('class', 'axis')
				.attr('transform', 'translate(' + me.margins.left + ', 0)');
		}
		me.callAxes();
		
		me.svgInitialized = true;
		
		me.dataBin.push(data);
 	},
 	
 	/**
 	 * @function
 	 * @description Append markers (circles) to a particular "g" element
 	 * @param gEl <svg:g>
 	 * @param data Object[]
 	 */
 	appendMarkers: function(gEl, data) {
	 	var me = this;
		
		var xScale = me.xScale,
  			xDataMetric = me.xDataMetric,
  			yScale = me.yScale,
  			yDataMetric = me.yDataMetric;
  			
  		gEl.selectAll('circle')
	  		.data(data)
	  		.enter()
	  		.append('circle')
	  		.attr('cx', function(d) {
		  		return xScale(d[xDataMetric]);
		  	})
		  	.attr('cy', function(d) {
			  	return yScale(d[yDataMetric]);
			 })
			.attr('r', me.markerRadius)
			.style('fill', me.fillColor)
			.style('stroke', 'black')
			.style('stroke-width', 1);
 	},
 	
 	/**
  	 * @function
  	 * @description Transition existing lines/markers
  	 */
 	transitionExisting: function() {
	 	var me = this;
	 	
	 	var xScale = me.xScale,
		 	yScale = me.yScale,
		 	xDataMetric = me.xDataMetric,
		 	yDataMetric = me.yDataMetric;
	 	
		me.gCanvas.selectAll('g .series path').attr('d', me.canvasLine);
		
		me.gCanvas.selectAll('g .series circle')
			.transition()
			.duration(250)
			.attr('cx', function(d) {
				return xScale(d[xDataMetric]);
			})
			.attr('cy', function(d) {
				return yScale(d[yDataMetric]);
			});
	},
	
 	/**
 	 * @function
 	 * @memberOf App.util.d3.Scatterplot
 	 * @description Set the horizontal scale
 	 * @param metric String
 	 * @param data Object[]
 	 */
	setXScale: function(metric, data) {
		var me = this;
		
		var xMin = d3.min(data, function(d) { return d[metric]; });
		var xMax = d3.max(data, function(d) { return d[metric]; });
		
		// minimum x
		if(me.currentMinX == null) {
			me.currentMinX = xMin;
		} else {
			if(me.currentMinX > xMin) {
				me.currentMinX = xMin;
			}
		}
		
		// maximum x
		if(me.currentMaxX == null) {
			me.currentMaxX = xMax;
		} else {
			if(me.currentMaxX < xMax) {
				me.currentMaxX = xMax;
			}
		}
		
		me.xScale = d3.scale.linear()
			.domain([me.currentMinX, me.currentMaxX])
			.range([me.margins.left, me.canvasWidth - me.margins.right]);
			
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
 	 * @param data Object[]
 	 */
	setYScale: function(metric, data) {
		var me = this;
		
		var yScalePadding = me.yScalePadding,
			yMin = d3.min(data, function(d) { return d[metric]; }),
			yMax = d3.max(data, function(d) { return d[metric]; });
			
		// minimum y
		if(me.currentMinY == null) {
			me.currentMinY = yMin;
		} else {
			if(me.currentMinY > yMin) {
				me.currentMinY = yMin;
			}
		}
		
		// maximum x
		if(me.currentMaxY == null) {
			me.currentMaxY = yMax;
		} else {
			if(me.currentMaxY < yMax) {
				me.currentMaxY = yMax;
			}
		}
		
		me.yScale = d3.scale.linear()
			//.domain([me.currentMinY, me.currentMaxY])
			.domain([0, me.currentMaxY])
			.range([me.canvasHeight - me.margins.bottom, me.margins.top]);
			
		me.yAxis = d3.svg.axis()
			.scale(me.yScale)
			.orient('left')
			.ticks(me.yTicks)
			.tickFormat(me.yTickFormat);	
	},
	
	/**
 	 * @function
 	 * @description Call the X/Y axes generation/transition functions
 	 */
 	callAxes: function() {
	 	var me = this;
	 	me.gXAxis.call(me.xAxis);
		me.gYAxis.call(me.yAxis);
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
			
		/*me.canvasArea = d3.svg.area()
			.x(function(d) { return xScale(d[xDataMetric]); })
			.y0(me.canvasHeight - me.margins.bottom)
			.y1(function(d) { return yScale(d[yDataMetric]); });*/
	},
	
	generateRandomHexColor: function() {
		var r = Math.floor(Math.random() * 203).toString(16),
			g = Math.floor(Math.random() * 203).toString(16),
			b = Math.floor(Math.random() * 203).toString(16);
			
		if(r.length == 1) { r = '0' + r; }
		if(g.length == 1) { g = '0' + g; }
		if(b.length == 1) { b = '0' + b; }
		
		return [r, g, b].join('');
	},
	
	/**
 	 * @function
 	 * @description Remove all g.series
 	 */
 	clearSeries: function() {
	 	var me = this;
	 	
	 	me.gCanvas.selectAll('g .series').remove();
	 	
	 	me.currentMinX = null,
		me.currentMaxX = null,
		me.currentMinY = null,
		me.currentMaxY = null;
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
 	 * SETTERS
 	 */
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
	
	setShowLabels: function(bool) {
		var me = this;
		
		me.showLabels = bool;
	}
});