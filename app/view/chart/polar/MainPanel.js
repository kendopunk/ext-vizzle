/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.chart.polar
 * @description Chart.js polar coordinates drawing
 */
Ext.define('App.view.chart.polar.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.polarMainPanel',
	title: 'Line/Area Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.baseDate = '8/31/2013',
 			me.baseTitle = 'Random Price Data over Time',
 			me.defaultXDataMetric = 'timestamp',
 			me.defaultYDataMetric = 'price',
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Polar Coordinates</b>';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.items = [{
			xtype: 'box',
			autoEl: {
				tag: 'canvas',
				width: 300,
				height: 300
			}
		}];
		
// http://jsjoy.com/blog/62/ext-js-and-canvas-integration
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		// after render, initialize the canvas
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.scatterplot.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		console.debug(me.items.items[0].el.dom);
		
		var canvas = me.items.items[0].el.dom;
  var ctx = canvas.getContext("2d");
 
  ctx.fillStyle = "red";
 
  ctx.beginPath();
  ctx.moveTo(30, 30);
  ctx.lineTo(150, 150);
  ctx.bezierCurveTo(60, 70, 60, 70, 70, 150);
  ctx.lineTo(30, 30);
  ctx.fill();
	
	 }
});