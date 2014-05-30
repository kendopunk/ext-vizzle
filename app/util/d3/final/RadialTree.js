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
    		/*.value(function(d) {
	    		if(dataMetric == 'count') {
		    		return 1;
		    	}
		    	return d[dataMetric];
		    });*/
    
    	me.arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    		
    	var arcObject = me.arc;
    	
    	////////////////////////////////////////
    	// SET x/y scales
    	////////////////////////////////////////
    	me.setScales();
    	
    	////////////////////////////////////////
    	// path "g"
    	////////////////////////////////////////
    	me.gPath = me.svg.append('svg:g')
    		.datum(me.graphData);
    		
    	////////////////////////////////////////
    	// label "g"
    	////////////////////////////////////////
    	me.gLabel = me.svg.append('svg:g')
	    	.datum(me.graphData);
	    	
	    ////////////////////////////////////////
	    // HANDLERS
	    ////////////////////////////////////////
	    me.handlePaths(true);
	    me.handleLabels();
	    
	    ////////////////////////////////////////
	    // INIT PATH
	    ////////////////////////////////////////
    	/*me.path = me.gPath.selectAll('path')
			.data(me.partition.nodes)  // count
	    	.enter()
	    	.append('path')
	    	.attr('display', function(d) {
		    	return d.depth ? null : 'none';	// hide inner ring
		    })
		    .attr('d', me.arc)
		    .style('stroke', '#FFFFFF')
		    .style('fill', function(d) {
			    return colorScale((d.children ? d : d.parent).name);
			})
			.style('fill-rule', 'evenodd')
			.each(me.stash);*/
		
		////////////////////////////////////////
	    // INIT LABEL
	    ////////////////////////////////////////
	    /*me.labels = me.gLabel.selectAll('text')
			.data(me.partition.nodes)
			.enter()
			.append('text')
			.style('fill', 'black')
			.attr('display', function(d) {
		    	return d.depth ? null : 'none';	// hide root
		    })
		    .attr('class', 'miniText')
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
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d.name;
			});*/
 	},
 	
 	/**
 	 * @function
 	 * @description Transition drawing
 	 */
 	transition: function() {
	 	var me = this;
		var dataMetric = me.dataMetric;
		
		var arcObject = me.arc;
		
		me.handlePaths(false);
		me.handleLabels();

		/*me.path.data(me.partition.value(function(d) {
		 	if(dataMetric == null || dataMetric == 'count') {
			 	return 1;
			}
			return d[dataMetric];
	 	}).nodes)
	 	.transition()
	 	.duration(500)
	 	.attrTween('d', function(a) {
		 	return me.arcTween(a);
		 });*/
		 
		/*me.labels.data(me.partition.value(function(d) {
		 	if(dataMetric == null || dataMetric == 'count') {
			 	return 1;
			}
			return d[dataMetric];
		}).nodes)
		.transition()
	 	.duration(500)
		.attr('transform', function(d) {
			var startAngle = d.x,
					endAngle = d.x + d.dx,
					rot = 0;
					
				var a = (startAngle + endAngle) * 90/Math.PI - 90;
				if(a > 90) {
					rot = a-180;
				} else {	
					rot = a;
				}
				
				return 'translate(' + arcObject.centroid(d) + '),rotate(' + rot + ')';
			});*/
 	},
 	
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
			.on('mouseover', function(d) {
				console.dir(d);
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
		    	.style('fill', function(d) {
			   	 return colorScale((d.children ? d : d.parent).name);
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
			    	return colorScale((d.children ? d : d.parent).name);
				})
				.style('fill-rule', 'evenodd');
		}
	},
	
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
			
			
 	stash: function(d) {
	 	d.x0 = d.x;
	 	d.dx0 = d.dx;
	},
	
	arcTween: function(a) {
		var me = this;
		
		//console.debug(me.arc);
		
		var arc = me.arc;
		
		//var arc = me.arc;
		
		/*var arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });*/
    		
		//console.log('In arcTween()...');
		//console.debug(arc);
		
		var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
		
		return function(t) {
			var b = i(t);
			a.x0 = b.x;
			a.dx0 = b.dx;
			return arc(b);
		};
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