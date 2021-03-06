/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Radial treemap (sunburst)
 */
Ext.define('App.util.d3.UniversalRadialTree', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	arc: null,
	canvasHeight: 400,
	canvasWidth: 400,
	chartInitialized: false,
	colorLightenFactor: 8,
	colorScale: d3.scale.category20(),
	dataMetric: 'count',
	eventRelay: null,
	
	gCanvas: null,
	gLabel: null,
	gPath: null,
	
	handleEvents: false,
	labels: null,
	labelClass: 'miniText',
	labelFunction: function(d) {
		return 'label';
	},
	labelVisibilityThreshold: 0.02,
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
	partition: null,
	path: null,
	radius: null,
	radiusScaleFactor: .9,
	tooltipFunction: function(d) {
		return 'tooltip';
	},
	xScale: null,
	yScale: null,
	
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);

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
		
		// default radius
	 	if(me.radius == null) {
			me.radius = Ext.Array.min([me.canvasWidth, me.canvasHeight])/2 * me.radiusScaleFactor;
		}
		
		me.partition = d3.layout.partition()
			.sort(null)
			.size([2 * Math.PI, me.radius * me.radius]);
    
    	me.arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    		
    	me.gCanvas = me.svg.append('svg:g')
	    	.attr('transform', 'translate(' 
	    		+ Math.floor(me.canvasWidth/2) 
	    		+ ',' 
	    		+ Math.floor(me.canvasHeight/2) 
	    		+ ')');
	    		
	    me.gPath = me.gCanvas.append('svg:g');
	    
	    me.gLabel = me.gCanvas.append('svg:g');
	    
	    return me;
	},
	
	/**
 	 * @function
 	 * @description 
 	 */
 	draw: function() {
	 	var me = this;
	 	
	    ////////////////////////////////////////
	    // HANDLERS
	    ////////////////////////////////////////
	 	me.setScales();
	 	me.handlePaths();
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
	 		colorScale = me.colorScale,
	 		colorLightenFactor = me.colorLightenFactor;
	 		
	 	// join
	 	var pathSelection = me.gPath.data([me.graphData])
		 	.selectAll('path')
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
			.style('opacity', .8)
			.style('stroke', '#FFFFFF')
			.style('stroke-width', 1.5)
			.style('fill-rule', 'evenodd')
			.on('mouseover', function(d, i) {
				d3.select(this)
					.style('opacity', 1);
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.style('opacity', .8);
			});
			
		
		// transition
		pathSelection.transition()
			.duration(500)
			.attr('display', function(d) {
		   	 	return d.depth ? null : 'none';	// hide inner ring
		    })
		    .attrTween('d', function(a) {
		 		return me.arcTween(a);
		 	})
			.style('fill', function(d, i) {
				var baseColor;
				//var baseColor = colorScale((d.children ? d : d.parent).name);
				
				// use either "d.name" or "d.parent.name"
				if(d.children) {
					baseColor = colorScale(d.name);
				} else {
					if(d.parent.depth == 0) {
						baseColor = colorScale(i);
					} else {
						baseColor = colorScale(d.parent.name);
					}

					baseColor = colorScale(d.parent.name);
				}

				
		    	return '#' +  App.util.Global.hexLightenDarken(baseColor, (d.depth * colorLightenFactor));
		    	
			})
			.each(me.stash);
			
		// call tooltips
		pathSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	/**
 	 * @function
 	 * @description Handle arc label placement and rotation
 	 */
	handleLabels: function() {
		var me = this;
		
		var dataMetric = me.dataMetric,
			arcObject = me.arc,
			labelVisibilityThreshold = me.labelVisibilityThreshold;
		
		// join
		var labelSelection = me.gLabel.data([me.graphData])
			.selectAll('text')
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
		    .attr('class', me.labelClass)
		    .style('text-anchor', 'middle');
		    
		// transition
		labelSelection.transition()
			.duration(500)
			.attr('display', function(d, i) {
				if(d.depth == 0) { return 'none'; }	// hide root;
				
				if(Math.abs(d.dx) < labelVisibilityThreshold) {
					return 'none';
				}
				
				return null;
			})
			.attr('transform', function(d) {
				var startAngle = d.x,
					endAngle = d.x + d.dx,
					rot = 0;
					
				var diff = startAngle - endAngle;
					
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
			.text(me.labelFunction);

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
	setDataMetric: function(metric) {
		var me = this;
		me.dataMetric = metric || 'count';
	},
	
	setGraphData: function(data) {
		var me = this;
		me.graphData = data;
	},
	
	setLabelFunction: function(fn) {
		var me = this;
		me.labelFunction = fn;
	},
	
	setScales: function() {
		var me = this;
		
		me.xScale = d3.scale.linear().range([0, 2*Math.PI]);
    	me.yScale = d3.scale.linear().range([0, me.radius]);
    	
		return;
	},
	
	setTooltipFunction: function(fn) {
		var me = this;
		me.tooltipFunction = fn;
	}
});