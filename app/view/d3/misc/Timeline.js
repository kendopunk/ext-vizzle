/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.misc
 * @description Configurable, responsive timeline chart
 */
Ext.define('App.view.d3.misc.Timeline', {
	extend: 'Ext.Panel',
	alias: 'widget.timeline',
	title: 'Timeline',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalTimeline'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.rawData = null,
 			me.graphData = null,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.baseTitle = 'Timeline',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Timeline</b><br><br>'
			+ 'Allows for multiple timeline entries per category (manager/coach)<br><br>'
			+ 'Coaching history from Wikipedia.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.on('afterrender', me.initCanvas, me);
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @description Initialize drawing canvas
	 */
	initCanvas: function(panel) {
		var me = this;
		
		panel.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
	 		me.canvasWidth = Math.floor(panel.body.dom.offsetWidth * .95),
	 		me.canvasHeight = Math.floor(panel.body.dom.offsetHeight * .95),
 			me.panelId = '#' + panel.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// initialize chart
	 	me.timeline = Ext.create('App.util.d3.UniversalTimeline', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			chartTitle: 'foo'
		}, me);
		
		
	 	
	 	// get data
	 	// get the data via Ajax call
	 	Ext.Ajax.request({
	 		url: 'data/coaches.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.rawData = resp;
	 			var dat = resp['yankees'];
	 			
	 			var allDates = Ext.pluck(dat, 'dates');
	 			
	 			var temp = Ext.Array.flatten(allDates);
	 			
	 			console.debug(temp);
	 			
	 			var minDate = d3.max(temp, function(d) {
	 					return d.getTime();
	 					
	 					// get full Year (that's the formatter)
	 			});
	 			
	 			console.debug(minDate);
	 			
	 			
	 			
	 			
	 			
	 			
	 			
	 			
	 			
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	}
});