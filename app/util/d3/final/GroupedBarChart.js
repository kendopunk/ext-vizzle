/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Highly configurable grouping bar chart
 */
Ext.define('App.util.d3.final.GroupedBarChart', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	barPadding: 3,
	
	canvasHeight: 400,
	canvasWidth: 400,
	colorScale: d3.scale.category20(),
	
	fixedColorRange: null,
	fixedColorRangeIndex: null,
	
	gBar: null,
	gBarLabel: null,
	gGrouper: null,
	gXAxis: null,
	gYAxis: null,
	
	graphData: [],
	grouperField: 'grouper',
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 100,
		leftAxis: 85
	},

	xAxis: null,
	xMetric: 'id',
	xScale: null,
	
	yAxis: null,
	yAxisScale: null,
	yMetric: 'value',
	yScale: null,
	
	/**
 	 * constructor
 	 */
 	constructor: function(config) {
	 	var me = this;
	 	
	 	Ext.apply(me, config);
	},
	
	/**
 	 * @function
 	 * @description Initial drawing
 	 */
 	draw: function() {
 		var me = this;
 		
 		//////////////////////////////////////////////////
 		// local scope
 		//////////////////////////////////////////////////
 		var barPadding = me.barPadding,
 			canvasHeight = me.canvasHeight,
 			canvasWidth = me.canvasWidth,
 			colorScale = me.colorScale,
 			xMetric = me.xMetric,
	 		yMetric = me.yMetric,
	 		margins = me.margins,
	 		fixedColorRange = me.fixedColorRange,
	 		fixedColorRangeIndex = me.fixedColorRangeIndex;

 		//////////////////////////////////////////////////
 		// "gBar"
 		//////////////////////////////////////////////////
 		me.gBar = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.left + ', 0)');
	 		
	 	//////////////////////////////////////////////////
	 	// "gGrouper" (grouped X axis)
	 	//////////////////////////////////////////////////
	 	me.gGrouper = me.svg.append('svg:g')
	 		.attr('transform', 'translate(' + me.margins.left + ',0)');
	 		
	 	//////////////////////////////////////////////////
 		// "gXAxis"
 		//////////////////////////////////////////////////
 		me.gXAxis = me.svg.append('svg:g');
 		
 		//////////////////////////////////////////////////
 		// "gYAxis"
 		//////////////////////////////////////////////////
 		me.gYAxis = me.svg.append('svg:g');
 		
		//////////////////////////////////////////////////
		// set X and Y scales, bring into local scope
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		me.setYAxisScale();
		var _xScale = me.xScale, _yScale = me.yScale,
			_xAxis = me.xAxis, _yAxis = me.yAxis;
		
		//////////////////////////////////////////////////
		// draw rectangles
		//////////////////////////////////////////////////
		me.gBar.selectAll('rect')
			.data(me.graphData)
			.enter()
			.append('rect')
			.attr('x', function(d) {
				return _xScale(d[xMetric]);
			})
			.attr('y', function(d) {
				return canvasHeight - _yScale(d[yMetric]);
			})
			.attr('width', function(d) {
				return _xScale.rangeBand() - barPadding;
			})
			.attr('height', function(d) {
				return _yScale(d[yMetric]) - margins.bottom;
			})
			.style('fill', function(d, i) {
				if(fixedColorRange != null && fixedColorRangeIndex != null) {
					return fixedColorRange[d.name];
				} else {
					return colorScale(i);
				}
			})
			.style('opacity', 0.6)
			.style('stroke', 'black')
			.style('stroke-width', 1);

		//////////////////////////////////////////////////
		// call the X axis function
		//////////////////////////////////////////////////
		var gXAxisTranslateY = canvasHeight - margins.bottom;
		me.gXAxis.attr('class','axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', ' + gXAxisTranslateY + ')')
			.call(_xAxis);
			
		//////////////////////////////////////////////////
		// call the Y axis function
		//////////////////////////////////////////////////
		me.gYAxis.attr('class', 'axis')
			.attr('transform', 'translate(' + margins.leftAxis + ', 0)')
			.call(_yAxis);
 	},
 	
 	/**
 	 * @function
 	 * @description shift and transition
 	 */
 	transition: function() {
 		var me = this;
 		
 		//////////////////////////////////////////////////
 		// local scope
 		//////////////////////////////////////////////////
 		var barPadding = me.barPadding,
 			canvasHeight = me.canvasHeight,
 			canvasWidth = me.canvasWidth,
 			colorScale = me.colorScale,
 			xMetric = me.xMetric,
	 		yMetric = me.yMetric,
	 		margins = me.margins,
	 		fixedColorRange = me.fixedColorRange,
	 		fixedColorRangeIndex = me.fixedColorRangeIndex;
	 		
		//////////////////////////////////////////////////
		// reset the x/y scales
		//////////////////////////////////////////////////
		me.setXScale();
		me.setYScale();
		me.setYAxisScale();
		var _xScale = me.xScale, _yScale = me.yScale,
			_xAxis = me.xAxis, _yAxis = me.yAxis;
		
		//////////////////////////////////////////////////
		//
		// RECTANGLE TRANSITION
		//
		//////////////////////////////////////////////////
		// join new data with old
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
			
		// transition out old bars
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();

		// add new bars
		var newBars = rectSelection.enter()
			.append('rect');
			
		// add new bars
		var newBars = rectSelection.enter()
			.append('rect');
			
		// transition all
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d) {
				return _xScale(d[xMetric]);
			})
			.attr('y', function(d) {
				return canvasHeight - _yScale(d[yMetric]);
			})
			.attr('width', function(d) {
				return _xScale.rangeBand() - barPadding;
			})
			.attr('height', function(d) {
				return _yScale(d[yMetric]) - margins.bottom;
			})
			.style('fill', function(d, i) {
				if(fixedColorRange != null && fixedColorRangeIndex != null) {
					console.log(d.name);
					console.log(fixedColorRange[d.name]);
					return fixedColorRange[d.name];
				} else {
					return colorScale(i);
				}
			})
			.style('opacity', 0.6)
			.style('stroke', 'black')
			.style('stroke-width', 1);
			
		//////////////////////////////////////////////////
		//
		// re-call the Y axis function
		//
		//////////////////////////////////////////////////
		me.gYAxis.transition().duration(500).call(me.yAxis);
 	},
 	
	/**
 	 * @function
 	 * @description Set the X-scaling value
 	 */
 	setXScale: function() {
	 	var me = this;
	 	
	 	var graphData = me.graphData,
		 	xMetric = me.xMetric;
	 	
	 	me.xScale = d3.scale.ordinal()
		 	.domain(graphData.map(function(item) {
			 	return item[xMetric];
			 }))
		 	.rangeRoundBands([0, me.canvasWidth - me.margins.right - me.margins.left], .08);
		 	
		me.xAxis = d3.svg.axis()
			.scale(me.xScale)
			.tickSize(0)
			.tickPadding(6)
			.tickFormat(function(d) {
				return '';
			})
			.orient('bottom');
	},
	
	/**
	 * @function
	 * @description Set the Y scaling
	 */
	setYScale: function() {
		var me = this;
		
		var yMetric = me.yMetric;
		
		me.yScale = d3.scale.linear()
			.domain([d3.max(me.graphData, function(d) { return d[yMetric]; }), 0])
			.range([
				me.canvasHeight - me.margins.top,
				me.margins.bottom
			]);
	},
	
	/**
 	 * @function
 	 * @description Set the scale for the yAxis (different range)
 	 */
	setYAxisScale: function(metric) {
		var me = this;
		
		var yMetric = me.yMetric;
		
		me.yAxisScale = d3.scale.linear()
			.domain([0, d3.max(me.graphData, function(d) { return d[yMetric]; })])
			.range([
				me.canvasHeight - me.margins.bottom,
				me.canvasHeight - (me.canvasHeight - me.margins.top)
			]);
			
		
		me.yAxis = d3.svg.axis()
			.scale(me.yAxisScale)
			.orient('left')
			.ticks(10)
			.tickFormat(me.yTickFormat);
	},
	
	/**
 	 * @function
 	 * @description Instead of the standard X axis, we use a grouping mechanism
 	 * to display X axis information
 	 * @param clearFirst Boolean
 	 */
 	triggerGroupers: function(clearFirst) {
 		var me = this;
 		
 		var xScale = me.xScale,
	 		barPadding = me.barPadding,
	 		graphData = me.graphData,
	 		lineData = [],
	 		finalData = [],
	 		workingGroupers = [],
	 		grouperField = me.grouperField;
	 		
	 	if(clearFirst) {
		 	me.gGrouper.selectAll('path').remove();
		 	me.gGrouper.selectAll('text').remove();
		}

 		////////////////////////////////////////
 		// unique array of "grouper" fields
 		////////////////////////////////////////
 		workingGroupers = Ext.Array.unique(Ext.pluck(me.graphData, grouperField));
 		if(workingGroupers.length == 0) {
	 		return;
	 	}
	 	
	 	////////////////////////////////////////
	 	// run through the groupers and configure
	 	// the line data
	 	////////////////////////////////////////
	 	var ind = 0;
	 	Ext.each(workingGroupers, function(grouper) {
	 		var g = grouper;
	 		
	 		lineData.push({
		 		group: g,
		 		data: []	// empty
		 	});
		 	
		 	Ext.each(me.graphData, function(rec) {
			 	if(rec[grouperField] == grouper) {
				 	lineData[ind].data.push(rec.id);
				}
			});
			
			ind++;
		});
		
		////////////////////////////////////////
		// now, finalize the data with "pathData"
		// array/object for use in the path generation
		// function
		////////////////////////////////////////
		Ext.each(lineData, function(d) {
			finalData.push({
			 	group: d.group,
			 	pathData: [{
				 	x: xScale(d.data[0]),
				 	y: me.canvasHeight - me.margins.bottom + 10
			 	}, {
			 		x: xScale(d.data[0]),
				 	y: me.canvasHeight - me.margins.bottom + 18
			 	}, {
			 		x: xScale(d.data[d.data.length-1]) + xScale.rangeBand() - barPadding,
			 		y: me.canvasHeight - me.margins.bottom + 18
			 	}, {
			 		x: xScale(d.data[d.data.length-1]) + xScale.rangeBand() - barPadding,
			 		y: me.canvasHeight - me.margins.bottom + 10
			 	}]
			 });
		 });
		 
		 ////////////////////////////////////////
		 // generic path function
		 ////////////////////////////////////////
		 var pathFn = d3.svg.line()
		 	.x(function(d) { return d.x; })
		 	.y(function(d) { return d.y; })
		 	.interpolate('linear');
		 
		 ////////////////////////////////////////
		 // draw the paths
		 ////////////////////////////////////////
		 me.gGrouper.selectAll('path')
			 .data(finalData)
			 .enter()
			 .append('path')
			 .attr('d', function(dat) {
			 	return pathFn(dat.pathData);
			 })
			 .attr('stroke', 'SeaGreen')
			 .attr('shape-rendering', 'crispEdges')
			 .attr('stroke-width', 1)
			 .attr('fill', 'none');
			 	
		////////////////////////////////////////
		// generate the text
		////////////////////////////////////////
		me.gGrouper.selectAll('text')
			.data(finalData)
			 .enter()
			 .append('text')
			 .attr('x', function(d) {
				 var xMin = d.pathData[0].x;
				 var xMax = d.pathData[d.pathData.length-1].x;
				 	
				 return parseInt((xMin + xMax)/2);
			 })
			 .attr('y', me.canvasHeight - me.margins.bottom + 30)
			 .style('font-family', 'sans-serif')
			.style('font-size', '9px')
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d.group;
			});
 	},
 	
 	/**
  	 *
  	 *
  	 * SETTERS
  	 *
  	 *
  	 */
  	setGraphData: function(d) {
	  	var me = this;
	  	
	  	me.graphData = d;
	}
});
