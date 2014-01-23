/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.geo.basic
 * @description Basic mapping / geo panel
 */
Ext.define('App.view.d3.geo.basic.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.geoBasicMainPanel',
	title: 'Basic Geo',
	closable: true,
	
	requires: [
		'App.util.d3.geo.Us',
		'App.util.MessageBus'
	],
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
	 		me.originalGraphData = [],
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki',
 			me.width = 
 				parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
 			me.height = 
	 			parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
	 		me.usMapRenderedEvent = 'geoBasicRendered',
	 		me.usMap = Ext.create('App.util.d3.geo.Us', {
		 		fill: '#ECEECE',
		 		mouseOverFill: '#CCCC99',
		 		mapRenderedEvent: me.usMapRenderedEvent
		 	}, me);
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>Basic Geo</b>';
		
		/**
 		 * @listener
 		 * @description On activate, publish update to the "info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		/**
 		 * @listener
 		 * @description After rendering, initialize the map and execute
 		 * other drawing functionality
 		 */
 		me.on('afterrender', me.initCanvas, me);
 		
 		/**
  		 * @listener
  		 * @description After the map template has been, execute the overlay functionality
  		 */
  		me.eventRelay.subscribe(me.usMapRenderedEvent, me.initData, me);

 		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @description Initialize the canvas, map, etc.
 	 */
 	initCanvas: function(panel) {
	 	var me = this;
	 	
		me.canvasWidth = parseInt(me.width * .95);
		me.canvasHeight = parseInt(me.height * .95);
		me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
		me.svgInitialized = true;
		
		// set map properties
		me.usMap.setSvg(me.svg);
		me.usMap.setCanvasDimensions(me.canvasWidth, me.canvasHeight);
		me.usMap.draw();
	},
	
	/**
 	 * @function
 	 * @description Data initialization
 	 */
	initData: function() {
		var me = this;
		
		Ext.Ajax.request({
			url: 'data/tornado.json',
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				me.originalGraphData = resp.data;
				me.graphData = resp.data;
			},
			callback: function() {
				me.draw();
			},
			scope: me
		});
	},
	
	draw: function() {
		var me = this;
		
		// local scope
		var usMap = me.usMap;
		
		
		me.svg.selectAll('circle')
			.data(me.graphData)
			.enter()
			.append('circle')
			.attr('cx', function(d, i) {
				return usMap.getMapCoords(d.long, d.lat)[0];
			})
			.attr('cy', function(d, i) {
				return usMap.getMapCoords(d.long, d.lat)[1];
			})
			.attr('r', 3)
			.style('fill', '#990066');
	}
	
	
	
	
	
	
	
});