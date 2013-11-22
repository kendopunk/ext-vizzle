/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Simple pie chart class
 */
Ext.define('App.util.d3.PieChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * default data metric
 	 */
 	dataMetric: null,
	
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
	showLabels: false,
	labelFontSize: '10px',

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
	
	/**
	 * clearMode String
	 * options are "scale", "rotate", and "explode"
	 */
	clearMode: 'scale',
		
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus')
		}
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.PieChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function() {
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
		var dataMetric = me.dataMetric,
			canvasWidth = me.canvasWidth,
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
				return d[dataMetric];
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
			.on('mouseover', function(d, i) {
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
			});
		
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
				.style('font-size', me.labelFontSize)
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
	transition: function() {
		
		var me = this;
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var dataMetric = me.dataMetric,
			colorScale = me.colorScale,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius;
			
		//////////////////////////////////////////////////
		// new value function for pie layout
		//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[dataMetric];
		});
		
		//////////////////////////////////////////////////
		// join new arcs with old arcs
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData));
		
		//////////////////////////////////////////////////	
		// transition out old segments
		//////////////////////////////////////////////////
		segments.exit().remove();

		//////////////////////////////////////////////////
		// build new segments
		//////////////////////////////////////////////////	
		segments.enter()
			.append('g')
			.attr('class', 'arc')
			.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d, i) {
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
			});
			
		//////////////////////////////////////////////////
		// handle path changes
		//////////////////////////////////////////////////	
		me.svg.datum(me.graphData).selectAll('path')
			.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
		
		//////////////////////////////////////////////////
		// transition labels
		//////////////////////////////////////////////////
		if(me.showLabels) {
			var arc = me.arcObject;
			
			// remove current text elements
			me.gPie.selectAll('text').remove();
			
			// replacements
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
				.style('font-size', me.labelFontSize)
				.text(me.labelFunction);
		} else {
			me.gPie.selectAll('text')
				.transition()
				.duration(250)
				.attr('y', 1000)
				.remove();
		}
				
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
 	 * @memberOf App.util.d3.PieChart
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
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieChart
 	 */
 	setDataMetric: function(metric) {
	 	var me = this;
	 	
	 	me.dataMetric = metric;
	},
	
	/**
     * @function
     * @memberOf App.util.d3.PieChart
     */
	setOuterRadius: function(r) {
		var me = this;
		
		me.outerRadius = r;
		me.setArcObject();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieChart
 	 */
	setInnerRadius: function(r) {
		var me = this;
		
		me.innerRadius = r;
		me.setArcObject();
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieChart
 	 */
	setArcObject: function() {
		var me = this;
		
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
	},

	/**
	 * @function
	 * @memberOf App.util.d3.PieChart
	 */
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	/**
	 * @function
	 * @memberOf App.util.d3.PieChart
	 */
	setGraphData: function(data) {
		var me = this;
		
		me.graphData = data;
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieChart
 	 * @description Show/hide labels
 	 */
 	setShowLabels: function(bool) {
	 	var me = this;
	 	
	 	me.showLabels = bool;
	}
});