/**
 * @class
 * @memberOf App.view.d3.bar
 * @description Build-A-Bar main panel
 */
Ext.define('App.view.d3.buildabar.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.buildabarMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		//'App.view.d3.buildabar.VizPanel',
		//'App.view.d3.buildabar.GridPanel',
		//'App.store.movie.MovieStore'
	],
	
	//layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Build-A-Bar (Chart)</b><br><br>';
		
		/*
		// layout vars
		me.gridPanelHeight = 225,
			me.vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width - 225
			),
			me.vizPanelHeight = parseInt(
				(Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- me.gridPanelHeight
					- 15)
			),
			me.eventRelay = Ext.create('App.util.MessageBus');
			
		// shared store
		movieStore = Ext.create('App.store.movie.MovieStore');
		
		// visualization panel (north)
		me.vizPanel = Ext.create('App.view.d3.bar.VizPanel', {
			region: 'north',
			width: me.vizPanelWidth,
			height: me.vizPanelHeight,
			dataStore: movieStore,
			layout: 'fit'
		});
		
		// grid panel (center)
		me.gridPanel = Ext.create('App.view.d3.bar.GridPanel', {
			region: 'center',
			title: 'Movie Data Grid',
			height: me.gridPanelHeight,
			store: movieStore
		});
		
		// configure items
		me.items = [
			me.vizPanel,
			me.gridPanel
		];
		*/
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	}
});