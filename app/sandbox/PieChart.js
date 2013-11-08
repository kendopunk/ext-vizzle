Ext.define('Sandbox.util.viz.PieChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * default outer radius
 	 */
	outerRadius: 100,
	
	/**
 	 * default inner radius.  Radius > 0 = donut chart
 	 */
	innerRadius: 0,
	
	/**
 	 * Default canvas height
 	 */
	canvasHeight: 100,
	
	/**
 	 * Default canvas width
 	 */
	canvasWidth: 100,
	
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
 	 * mouse over events configuration object
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
		
		var colorScale = me.colorScale,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents,
			clearMode = me.clearMode,
			canvasHeight = me.canvasHeight;
			
		if(me.graphData.length == 0) {
			me.drawNoData();
			return;
		}
		
		// clear all "g" elements, keep the SVG element
		me.svg.selectAll('g')
			.transition()
			.duration(500)
			.attr('transform', me.getClearMode())
			.remove();
		
		var arc = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
			
		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[metric];
			});

		var gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.canvasWidth/2 + ',' + me.canvasHeight/2 + ')');
		
		var segments = gPie.selectAll('.arc')
			.data(pie(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc')
		
		segments.append('path')
			.attr('d', arc)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d) {
				if(handleEvents && eventRelay && mouseOverEvents.enabled) {
					eventRelay.publish(
						mouseOverEvents.eventName,
						{
							value: d.data[mouseOverEvents.eventDataMetric]
						}
					);
				}
				
				d3.select(this).style('opacity', .9);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
			});
				
		if(me.showLabels) {
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
				.text(me.labelFunction);
		}
	},
	
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
 	 * @memberOf Sandbox.util.viz.PieChart
 	 * @description "No data" drawing"
 	 */
	drawNoData: function() {
		var me = this;
		Sandbox.util.Global.noDataSvgImage(me.svg, me.canvasWidth, me.canvasHeight, 'No data');
	}
});