/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Radial treemap (sunburst)
 */
Ext.define('App.util.d3.final.RadialTree', {
	
	svg: null,
	
	gPath: null,
	gLabel: null,
	partition: null,
	arc: null,
	path: null,
	labels: null,
	
	canvasWidth: 300,
	canvasHeight: 300,
	dataMetric: 'count',
	radius: null,
	colorScale: d3.scale.category20(),
	
	xScale: null,
	yScale: null,
	
	/**
 	 * CONSTRUCTOR
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
	 	
	 	var colorScale = me.colorScale,
	 		dataMetric = me.dataMetric,
	 		graphData = me.graphData;
	 	
	 	if(me.radius == null) {
		 	me.radius = Math.min(me.canvasWidth, me.canvasHeight)/3;
		}
 	
 		me.partition = d3.layout.partition()
    		.sort(null)
    		.size([2 * Math.PI, me.radius * me.radius]);
    
    	me.arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    	
    	// local scope
    	var arcObject = me.arc;
    	
    	////////////////////////////////////////
    	// SET x/y scales
    	////////////////////////////////////////
    	me.setScales();
    	
    	////////////////////////////////////////
    	// path "g"
    	////////////////////////////////////////
    	me.gPath = me.svg.append('svg:g').datum(me.graphData);
    		
    	////////////////////////////////////////
    	// label "g"
    	////////////////////////////////////////
    	me.gLabel = me.svg.append('svg:g').datum(me.graphData);
	    	
	    ////////////////////////////////////////
	    // HANDLERS
	    ////////////////////////////////////////
	    me.handlePaths(true);
	    me.handleLabels();
 	},
 	
 	/**
 	 * @function
 	 * @description Transition drawing
 	 */
 	transition: function() {
	 	var me = this;
		var dataMetric = me.dataMetric;

		me.handlePaths(false);
		me.handleLabels();
 	},
 	
 	/**
  	 * @function
  	 * @description Handle drawing /transitioning of path elements
  	 * @param initialDrawing Boolean
  	 */
 	handlePaths: function(initialDrawing) {
 		var me = this;
 		
 		var dataMetric = me.dataMetric,
	 		colorScale = me.colorScale;
 		
 		// join
 		var pathSelection = me.gPath.selectAll('path')
	 		.data(me.partition.value(function(d) {
		 		if(dataMetric == null || dataMetric === undefined || dataMetric == 'count') {
			 		return 1;
			 	}
			 	return d[dataMetric];
			 }).nodes);
			 
		// remove
		pathSelection.exit().remove();
		
		// append
		pathSelection.enter()
			.append('path')
			.style('opacity', .7)
			.on('mouseover', function(d, i) {
				d3.select(this).style('opacity', 1);
			})
			.on('mouseout', function(d, i) {
				d3.select(this).style('opacity', .7);
			});
			
		// transition
		if(initialDrawing) {
			pathSelection.transition()
				.duration(250)
				.attr('display', function(d) {
		    		return d.depth ? null : 'none';	// hide inner ring
		  	  })
		    	.attr('d', me.arc)
		    	.style('stroke', '#FFFFFF')
		    	.style('fill', function(d, i) {
		    		var baseColor = colorScale((d.children ? d : d.parent).name);
		    		return '#' +  App.util.Global.hexLightenDarken(baseColor, (d.depth * 7));
				})
				.style('fill-rule', 'evenodd')
				.each(me.stash);
		} else {
			pathSelection.transition()
				.duration(250)
				.attr('display', function(d) {
		   	 		return d.depth ? null : 'none';	// hide inner ring
		    	})
		    	.attrTween('d', function(a) {
		 			return me.arcTween(a);
		 		})
				.style('stroke', '#FFFFFF')
				.style('fill', function(d) {
			    	var baseColor = colorScale((d.children ? d : d.parent).name);
		    		return '#' +  App.util.Global.hexLightenDarken(baseColor, (d.depth * 7));
		    		
		    		//return colorScale((d.children ? d : d.parent).name);
				})
				.style('fill-rule', 'evenodd');
		}
	},
	
	/**
 	 * @function
 	 * @description Handle arc label placement and rotation
 	 */
	handleLabels: function() {
		var me = this;
		
		var dataMetric = me.dataMetric,
			arcObject = me.arc;
		
		// join
		var labelSelection = me.gLabel.selectAll('text')
			.data(me.partition.value(function(d) {
		 		if(dataMetric == null || dataMetric === undefined || dataMetric == 'count') {
			 		return 1;
			 	}
			 	return d[dataMetric];
			 }).nodes);
			 
		// remove
		labelSelection.exit().remove();
		
		// append
		labelSelection.enter()
			.append('text')
			.style('fill', 'black')
			.attr('display', function(d) {
		    	return d.depth ? null : 'none';	// hide root
		    })
		    .attr('class', 'miniText')
		    .style('text-anchor', 'middle');
		    
		// transition
		labelSelection.transition()
			.duration(500)
			.attr('transform', function(d) {
				var startAngle = d.x,
					endAngle = d.x + d.dx,
					rot = 0;
					
				if(d.depth > 1) {
					
					var a = (startAngle + endAngle) * 90/Math.PI - 90;
					if(a > 90) {
						rot = a-180;
					} else {	
						rot = a;
					}
					}
				
				return 'translate(' + arcObject.centroid(d) + '),rotate(' + rot + ')';
			})
			.text(function(d) {
				return d.name;
			});
	},
	
	/**
	 * @function
	 * @description Stash values for later
	 */
 	stash: function(d) {
	 	d.x0 = d.x;
	 	d.dx0 = d.dx;
	},
	
	/**
 	 * @function
 	 * @description Arc transition method
 	 */
	arcTween: function(a) {
		var me = this;
		
		var arc = me.arc;
		
		var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
		
		return function(t) {
			var b = i(t);
			a.x0 = b.x;
			a.dx0 = b.dx;
			return arc(b);
		};
	},
	
	/**
 	 * @function
 	 * @description Wipe clean and redraw
 	 */
 	redraw: function() {
	 	var me = this;
		
		me.gPath.selectAll('path').remove();
		me.gLabel.selectAll('text').remove();
		me.draw();
	},
	
	/**
	 *
	 *
	 * SETTERS
	 *
	 *
	 */
	setGraphData: function(data, redraw) {
		var me = this;
		
		me.graphData = data;
		
		if(redraw) { me.redraw(); }
	},
	
	setScales: function() {
		var me = this;
		
		me.xScale = d3.scale.linear().range([0, 2*Math.PI]);
    	me.yScale = d3.scale.linear().range([0, me.radius]);
    	
		return;
	},
	
	setDataMetric: function(metric) {
		var me = this;
		
		me.dataMetric = metric || 'count';
	}
});