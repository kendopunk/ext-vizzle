Ext.define('App.util.d3.PieChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * pie components
 	 */
 	pieLayout: null,
 	arcObject: null,
 	gPie: null,
 	gTitle: null,
 	chartTitle: null,
	
	/**
 	 * default outer radius
 	 */
	outerRadius: null,
	
	/**
 	 * default inner radius.  Radius > 0 = donut chart
 	 */
	innerRadius: 0,
	
	/**
 	 * Default canvas height
 	 */
	canvasHeight: 200,
	
	/**
 	 * Default canvas width
 	 */
	canvasWidth: 200,
	
	/**
	 * An array of data objects for the graph
	 */
	graphData: [],
	
	/**
 	 * The ExtJS panel ID in which the drawing is rendered
 	 */
	panelId: null,
	
	/**
 	 * color scale
 	 */
	colorScale: d3.scale.category20(),
	
	/**
 	 * Show pie chart labels, default true
 	 */
	showLabels: true,

	/**
	 * Default function for the tooltip
	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
	 * Default function for the graph label
	 */
 	labelFunction: function(data, index) {
	 	return 'label';
	},
	
	/**
 	 * enable the handling of click/mouse events
 	 */
	handleEvents: false,
	
	/**
	 * @private
	 * Default message bus / event relay mechanism
	 */
	eventRelay: false,
	
	/**
 	 * margins object
 	 */
 	margins: {
 		top: 30
 	},
	
	/**
 	 * mouse events
 	 */
	mouseOverEvents: {
		enabled: false,
		eventName: '',
		eventDataMetric: ''
	},
	
	/**
	 * clearMode String
	 * options are "scale", "rotate", and "explode"
	 */
	clearMode: 'scale',
		
	constructor: function(config) {
		Ext.apply(this, config);
		
		if(config.handleEvents) {
			this.eventRelay = Ext.create('Sandbox.util.MessageBus')
		}
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.PieChart
 	 * @description Change inner radius
 	 */
	setInnerRadius: function(r) {
		this.innerRadius = r;
	},
	
	/**
	 * @function
	 * @memberOf Sandbox.util.viz.PieChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function(metric) {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			return;
		}
		
		//////////////////////////////////////////////////
		// bring vars into local scope
		//////////////////////////////////////////////////
		var canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight,
			colorScale = me.colorScale,
			innerRadius = me.innerRadius,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			clearMode = me.clearMode,
			chartTranslateX = parseInt(me.canvasWidth/2),
			chartTranslateY = parseInt(me.canvasHeight/2) + me.margins.top;
			
		//////////////////////////////////////////////////
		// set the outer radius if not specified
		//////////////////////////////////////////////////
		if(me.outerRadius == null) {
			if(me.canvasWidth < me.canvasHeight) {
				me.outerRadius = parseInt((me.canvasWidth * .92)/2);
			} else {
				me.outerRadius = parseInt((me.canvasHeight * .92)/2) - me.margins.top;
			}
		}
		var outerRadius = me.outerRadius;
		
		//////////////////////////////////////////////////
		// set the pie layout
		//////////////////////////////////////////////////
		me.pieLayout = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[metric];
			});
		
		//////////////////////////////////////////////////
		// set the arc objects
		//////////////////////////////////////////////////
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
			
		//////////////////////////////////////////////////
		// set the pie "g" element
		//////////////////////////////////////////////////
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
		
		//////////////////////////////////////////////////
		// set the arc selection
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc');
		
		//////////////////////////////////////////////////
		// append the paths
		//////////////////////////////////////////////////
		segments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			/*.on('mouseover', function(d) {
				
				if(handleEvents && eventRelay && mouseOverEvents.enabled) {
					eventRelay.publish(
						mouseOverEvents.eventName,
						{
							value: d.data[mouseOverEvents.eventDataMetric]
						}
					);
				}
				
				d3.select(this)
					.style('opacity', 1)
					.style('stroke', '#000000')
					.style('stroke-width', 1);
			})
			
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
				el.style('stroke', 'white')
				el.style('stroke-width', 1);
			})*/;
		
		//////////////////////////////////////////////////
		// SHOW labels ??
		//////////////////////////////////////////////////
		if(me.showLabels) {
			var arc = me.arcObject;
			
			segments.append('text')
				.attr('transform', function(d, i) {
					var c = arc.centroid(d),
						x = c[0],
						y = c[1],
						h = Math.sqrt(x*x + y*y);
						
					return 'translate(' + (x/h * outerRadius) + ',' + ((y/h * outerRadius) + i) + ')';
				})
				.attr('dy', function(d, i) {
					return i%2 == 0 ? '.35em' : '.95em';
				})
				.attr('text-anchor', function(d) {
					return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
				})
				.style('font-size', 10)
				.text(me.labelFunction);
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
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieChart
 	 * @description Transition the graphic
 	 */
	transition: function(metric) {
		var me = this,
			path = me.svg.datum(me.graphData).selectAll('path');
			
		var colorScale = me.colorScale;
			
		//////////////////////////////////////////////////
		// new value function for pie layout
		//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[metric];
		});
		
		//////////////////////////////////////////////////
		// transition the arcs
		//////////////////////////////////////////////////
		path.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
			
			
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData));
			
		segments.exit().remove();
		
		var arcs = segments.selectAll('.arc');
		
		arcs.exit.remove();
		
		segments
			.enter()
			.append('g')
			.attr('class', 'arc');
			
			segments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6);
	 	
	 	segments
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			
		//////////////////////////////////////////////////
		// transition chart title
		//////////////////////////////////////////////////
		var titleSelection = me.gTitle.selectAll('text');
		if(me.chartTitle) {
			titleSelection.text(me.chartTitle);
		} else {
			titleSelection.text('');
		}
	},
	
	/**
 	 * @function
 	 */
	getClearMode: function() {
		var me = this;
		
		switch(me.clearMode) {
			case 'explode':
			return 'scale(5, 5)';
			break;

			case 'rotate':
			case 'rotateLeft':
			case 'rotateRight':
			return 'rotate(90)';
			break;
			
			default:
			return 'scale(0,0)';
			break;
		}
	},
	
	setOuterRadius: function(r) {
		var me = this;
		
		me.outerRadius = r;
	},
	
	setInnerRadius: function(r) {
		var me = this;
		
		me.innerRadius = r;
	},
	
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	}
});