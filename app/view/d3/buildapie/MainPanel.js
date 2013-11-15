/**
 * @class
 * @memberOf App.view.d3.bar
 * @description Build-A-Bar main panel
 */
Ext.define('App.view.d3.buildapie.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.buildapieMainPanel',
	title: 'Pie Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.view.d3.buildapie.VizPanel',
		'App.view.d3.buildapie.GridPanel'
	],
	
	layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Build-A-Pie</b><br><br>'
			+ 'See Build-A-Bar for more information';
			
		// layout vars
		me.gridPanelWidth = 330,
			me.vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width
				- 330
				- App.util.Global.westPanelWidth
			),
			me.vizPanelHeight = parseInt(
				Ext.getBody().getViewSize().height
				- App.util.Global.titlePanelHeight
				- 15
			),
			me.eventRelay = Ext.create('App.util.MessageBus');
			
		// viz panel (north)
		me.vizPanel = Ext.create('App.view.d3.buildapie.VizPanel', {
			region: 'west',
			width: me.vizPanelWidth,
			height: me.vizPanelHeight,
			layout: 'fit'
		});
		
		// grid panel (center...south)
		me.gridPanel = Ext.create('App.view.d3.buildapie.GridPanel', {
			region: 'center',
			title: 'Stock Data',
			width: 300,
			height: '100%'
		});
		// configure items
		me.items = [
			me.vizPanel,
			me.gridPanel
		];
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	}
});
