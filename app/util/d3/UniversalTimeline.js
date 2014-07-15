/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Highly customizable, responsive timeline plotter
 */
Ext.define('App.util.d3.UniversalTimeline', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	/**
	 * other configs
	 */
	canvasHeight: 400,
	canvasWidth: 400,
	chartInitialized: false,
	chartTitle: null,
	colorScale: d3.scale.category20(),
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	eventRelay: null,
	
	// "g"
	gBar: null,
	gTitle: null,
	gXAxis: null,
	gYAxis: null,
	
	graphData: [],
	handleEvents: false,
	margins: {
		top: 10,
		right: 10,
		bottom: 10,
		left: 100,
		leftAxis: 90
	},
	mouseEvents: {
	 	mouseover: {
		 	enabled: false,
		 	eventName: null
		},
		mouseout: {
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
	orientation: 'horizontal',
	panelId: null,
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	xAxis: null,
	xScale: null,
	
	yAxis: null,
	yDataMetric: 'name',
	yScale: null,
	
	/**
 	 * init
 	 */
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
		
		// event handling
		if(me.handleEvents) {
			me.eventRelay = Ext.create('App.util.MessageBus');
		}
	}



});