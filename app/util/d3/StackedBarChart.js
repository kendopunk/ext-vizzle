/*
Ext.define('test', {
	svg: null,
	canvasHeight: 500,
	canvasWidth: 500,
	workingHeight: null,
	workingWidth: null,
	graphData: [],
	panelId: null,
	colorScale: d3.scale.category20(),
	margins: {
		top: 20,
		right: 20,
		bottom: 20,
		left: 20
	},
	
	*
 	 * "g" elements to hold bars, x-Axis and y-Axis
 	 *
 	gBar: null,
 	gXAxis: null,
 	gYAxis: null,
 	
 	*
  	 * scales
  	 *
  	xScale: null,
  	yScale: null,
  	
  	*
   	 * other SVG object
   	 *
  	keys: null,
  	stackLayout: null,
  	layers: null,
  	yMax: null,
 	
 	constructor: function(config) {
	 	var me  = this;
	 	
	 	Ext.apply(me, config);
	 	
	 	me.workingHeight = me.canvasHeight - me.margins.top - me.margins.bottom;
	 	me.workingWidth = me.canvasWidth - me.margins.left - me.margins.right;
	},
 	
 	*
 	 * @function
 	 * @description Draw the initial stacked bar chart
 	 *
	draw: function() {
		var me = this,
			data = me.graphData;
		
		// bring ExtJS variables
		// into local scope for use in D3
		var width = me.workingWidth,
			height = me.workingHeight,
			keys = me.keys,
			colorScale = me.colorScale,
			stackLayout = me.stackLayout;
			
		// apply the stack function to layers variable
		var layers = stackLayout(data);
		
		// max Y value (y0) is the position on the y scale
		// where a particular rect ends
		var yMax = d3.max(layers, function(layer) {
			return d3.max(layer.values, function(d) {
				return d.y0 + d.y;
			})
		});
		
		
		
// set up the xScale
		var xScale = d3.scale.ordinal()
			.domain(keys)
			.rangeRoundBands([0, width], .08);
		
		// set up the yScale			
		var yScale = d3.scale.linear()
			.domain([0, yMax])
			.range([height, 0]);
	
		
		
		
		
		// calculate the totals for each "id" value in the domain
		var totals = {};
		data.forEach(function(series) {
			series.values.forEach(function(item) {
				totals[item.id] = (totals[item.id] || 0) + item.y;
			})
		});
		
		
			
		
							
		var yAxis = d3.svg.axis()
							.scale(yScale)
							.tickSize(0)
							.tickPadding(6)
							.orient('left');
							
		var xAxis = d3.svg.axis()
							.scale(xScale)
							.tickSize(0)
							.tickPadding(6)
							.orient('bottom');
							
		var svg = me.svg.append('g')
			.attr('transform', 'translate(' + me.margins.left + ',' + me.margins.top + ')');
						
						var layer = svg.selectAll('.layer')
							.data(layers)
							.enter()
							.append('g')
							.attr('class', 'layer')
							.style('fill', function(d, i) {
								return colorScale(i);
							});
							
						layer.selectAll('rect')
							.data(function(d) {
								return d.values;
							})
							.enter()
							.append('rect')
							.attr('fill-opacity', .5)
							.attr('stroke', 'black')
							.style('stroke-width', 0.5)
							.attr('width', xScale.rangeBand())
							.attr('x', function(d) {
								return xScale(d.id);
							})
							.attr('y', function(d) {
								return yScale(d.y0 + d.y);
							})
							.attr('height', function(d) {
								return yScale(d.y0) - yScale(d.y0 + d.y);
							});
/*							.on('mouseover', function(d) {
								console.debug(d);
							});*
							
						/*layer.selectAll('text')
							.data(keys)
							.enter()
							.append('text')
							.text(function(d) {
								return d + ': ' + totals[d];
							})
							.attr('fill', '#000')
							.style('font-size', 9)
							.attr('x', function(d) {
								return xScale(d) + 25;
							})
							.attr('y', function(d) {
								//return yScale(d) + 40;
								return 100;
							});*
							
						svg.append('svg:g')
							.attr('class', 'axis')
							.attr('transform', 'translate(0,' + height + ')')
							.call(xAxis);
							
						svg.append('svg:g')
							.attr('class', 'axis')
							.call(yAxis);
		
		
	},
	
	transition: function() {
		var me = this;
		
		var layers = me.svg.selectAll('.layer');
		
		layers.selectAll('rect')
			.transition()
			.duration(500)
			.attr('transform', 'scale(0,0)')
			.remove();
			
		me.draw();
	},
	
	*
 	 * @function
 	 * @description Set the graph data object and associated params
 	 *
 	setGraphData: function(data) {
	 	var me = this;
	 	
	 	me.graphData = data;
	 	
	 	// update the color scale
	 	me.colorScale = d3.scale.linear()
		 	.domain([0, data.length - 1])
		 	.range(['#f00', '#00f']);

	 	// get array
	 	me.keys = me.graphData[0].values.map(function(item) {
		 	return item.id;
		});
		
		me.stackLayout = d3.layout.stack().values(function(d) {
			return d.values;
		});
	}	
});
*/