/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Radial treemap (sunburst)
 */
Ext.define('App.util.d3.final.RadialTree', {
	
	svg: null,
	gTitle: null,
	gLabel: null,
	gLegend: null,

	canvasWidth: 300,
	canvasHeight: 300,
	
	dataMetric: 'count',
	
	radius: null,
	colorScale: d3.scale.category20(),
	
	partition: null,
	arc: null,
	path: null,
	
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
    		.size([2 * Math.PI, me.radius * me.radius])
    		.value(function(d) {
	    		if(dataMetric == 'count') {
		    		return 1;
		    	}
		    	return d[dataMetric];
		    });
    
    	me.arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    		
    	var arcObject = me.arc;
    	
    	var containerG = me.svg.append('svg:g')
		    .datum(me.graphData);
	    
	    
	    	
	   // me.path = containerG.datum(me.graphData)
    	me.path = containerG.selectAll('path')
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
			.each(me.stash);
		
		
		var xScale = d3.scale.linear().range([0, 2 * Math.PI]);
 
 		var yScale = d3.scale.linear().range([0, me.radius]);
 		
		me.text = containerG.selectAll('text')
			.data(me.partition.nodes)
			.enter()
			.append('text')
			.style('fill', 'black')
			.attr('display', function(d) {
		    	return d.depth ? null : 'none';	// hide root
		    })
		    .attr('class', 'miniText')
			.attr('transform', function(d) {
				var temp, rot;
				
				//console.debug(d);
				
				var startAngle = d.x;
				var endAngle = d.x + d.dx;
				//console.log(d.name + ': ' + startAngle + ' AND ' + endAngle);
				
				var a = (startAngle + endAngle) * 90/Math.PI - 90;
				if(a > 90) {
					rot = a-180;
				} else {	
					rot = a;
				}
				
				
				/*var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
				if(a > 90) {
					temp = a-180;
				} else {
					temp = a;
				}*/
				
				//var rot = (yScale(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
				//var rot = 0;
				
				var trans = arcObject.centroid(d);
				console.debug(trans);
				
				return 'translate(' + arcObject.centroid(d) + '),rotate(' + rot + ')';
				// return 'translate(' + arcObject.centroid(d) + ')';
			})
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d.name;
			});
		
		/*
		var path = me.path;
		
		var xScale = d3.scale.linear().range([0, 2 * Math.PI]);
 
 		var yScale = d3.scale.linear().range([0, me.radius]);
 		
 		
 		
 		
		me.text = containerG.selectAll('text')
			.data(me.partition.nodes)
			.enter()
			.append('text')
			.attr('foo', function(d, i) {
				console.debug(d);
			
			});*/
			
			/*.attr('transform', function(d, i) {
				var rot = (xScale(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
				
				//return 'rotate(' + rot + ')';
				
				return 'rotate(0)';
			
			})
			//.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
			.attr("x", function(d) {
				//console.log(d.name + ' AND ' + d.y);
				//console.log(yScale(d.y));
				
				return yScale(d.y);
			})
			//.attr('x', 100)
			//.attr('y', 100)
			.attr("dx", "6") // margin
			.attr("dy", ".35em") // vertical-align
			.text(function(d) { return Math.random();});*/









	
		/*me.path.selectAll('text')
			.data(['foo'])
			.enter()
			.append('text')
			.attr('x', 100)
			.attr('y', 100)
			.text(function() {
				return Math.random();
			});*/
		
		/*
		
		var xScale = d3.scale.linear().range([0, 2 * Math.PI]);
 
 		var yScale = d3.scale.linear().range([0, me.radius]);
 	
 		//return (xScale(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
 		
 		var radius = me.radius;
 			
		me.text = me.svg.datum(me.graphData)
			.selectAll('text')
			.data(me.partition.nodes)	// count
			.enter()
			.append('text')
			.attr('x', function(d, i) {
				console.debug(d);
				
				// median of inner / outer
				var temp = (Math.sqrt(d.y) + Math.sqrt(d.y + d.dy)) / 2;
				return temp;
				
				
				
				//.innerRadius(function(d) { return Math.sqrt(d.y); })
    		//.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
				return radius;
				//return 100 + (i * 5);
				//return 10;
			})
			.attr('y', function(d, i) {
				return 20;
				//return xScale(d.x);
				//return 100 + (i * 7);
				//return -10;
			})
			.text(function(d, i) {
				return 'foo ' + i;
			});
			*/
 	},
 	
 	transition: function() {
	 	var me = this;
		var dataMetric = me.dataMetric;
		
		var arcObject = me.arc;

		me.path.data(me.partition.value(function(d) {
		 	if(dataMetric == null || dataMetric == 'count') {
			 	return 1;
			}
			return d[dataMetric];
	 	}).nodes)
	 	.transition()
	 	.duration(500)
	 	.attrTween('d', function(a) {
		 	return me.arcTween(a);
		 });
		 
		me.text.data(me.partition.value(function(d) {
		 	if(dataMetric == null || dataMetric == 'count') {
			 	return 1;
			}
			return d[dataMetric];
		}).nodes)
		.transition()
	 	.duration(500)
		.attr('transform', function(d) {
				var temp, rot;
				
				//console.debug(d);
				
				var startAngle = d.x;
				var endAngle = d.x + d.dx;
				//console.log(d.name + ': ' + startAngle + ' AND ' + endAngle);
				
				var a = (startAngle + endAngle) * 90/Math.PI - 90;
				if(a > 90) {
					rot = a-180;
				} else {	
					rot = a;
				}
				
				
				/*var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
				if(a > 90) {
					temp = a-180;
				} else {
					temp = a;
				}*/
				
				//var rot = (yScale(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
				//var rot = 0;
				
				return 'translate(' + arcObject.centroid(d) + '),rotate(' + rot + ')';
				// return 'translate(' + arcObject.centroid(d) + ')';
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
	
	setDataMetric: function(metric) {
		var me = this;
		
		me.dataMetric = metric || 'count';
	}
});