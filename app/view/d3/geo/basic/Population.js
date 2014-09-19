/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.geo.basic
 * @description World map - population
 */
Ext.define('App.view.d3.geo.basic.Population', {
	extend: 'Ext.Panel',
	alias: 'widget.geoPopulation',
	title: 'World Population Stats',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalWorldMap'
	],
	
	initComponent: function() {
		var me = this;
		
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>World Population Data</b>';
		
		me.on('afterrender', me.initCanvas, me);
		
		me.callParent(arguments);
	},
	
	initCanvas: function() {
		var me = this;
		
		me.canvasWidth = me.width,
			me.canvasHeight = me.height,
			me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
			
		me.worldMap = Ext.create('App.util.d3.UniversalWorldMap', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight
		});
		
		me.worldMap.initChart();
	}
});