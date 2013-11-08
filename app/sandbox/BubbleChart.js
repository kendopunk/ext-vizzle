Ext.define('Sandbox.util.viz.BubbleChart', {

	/**
 	 * The primary SVG element.  Must be set outside the class
 	 * and passed as a configuration item
 	 */
	svg: null,
	
	/**
 	 * circle radii
 	 */
 	minRadius: 5,
 	maxRadius: 10,
 	circlesPerRow: 5,
 	
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
 	 * scales
 	 */
 	xScale: null,
 	yScale: null,
	
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
		
	constructor: function(config) {
		Ext.apply(this, config);
		
		this.graphData = [20, 40, 60];
		
		if(config.handleEvents) {
			this.eventRelay = Ext.create('Sandbox.util.MessageBus')
		}
	},
	
	setMaxRadius: function() {
		var me = this;
		
		me.maxRadius =  parseInt(me.canvasWidth/me.circlesPerRow/2);
	},

	
	/**
	 * @function
	 * @memberOf Sandbox.util.viz.BubbleChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function(metric) {
		var me = this;
		
		me.setMaxRadius();
		
		var colorScale = me.colorScale,
			graphData = me.graphData,
			circlesPerRow = me.circlesPerRow,
			handleEvents = me.handleEvents,
			trueRadius = me.trueRadius,
			maxRadius = me.maxRadius,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents,
			canvasHeight = me.canvasHeight,
			xScale = me.xScale,
			yScale = me.yScale;
			
		me.svg.selectAll('circle')
			.data(graphData)
			.enter()
			.append('circle')
			.attr('cx', function(d, i) {
				return (i%circlesPerRow) * (maxRadius*2);
			})
			.attr('cy', function(d, i) {
				return 70;
			
			})
			.attr('r', function(d) {
				return parseInt(maxRadius * 1);
			})
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('transform', 'translate(88, 0)');
	}
});