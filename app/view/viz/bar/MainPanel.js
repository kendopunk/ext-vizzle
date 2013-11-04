/**
 * @class
 * @memberOf App.view.viz.bar
 * @description Standard bar chart
 */
Ext.define('App.view.viz.bar.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.view.viz.bar.VizPanel',
		'App.view.viz.bar.GridPanel',
		'App.store.movie.MovieStore'
	],
	
	//layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		// layout variables
		var northPanelHeight = 50,
			gridPanelHeight = 250,
			vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width - App.util.Global.treePanelWidth
			),
			vizPanelHeight = parseInt(
				Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- northPanelHeight
					- gridPanelHeight
			);
			
		// shared store
		movieStore = Ext.create('App.store.movie.MovieStore');
		
		// add items
		me.items = [{
			xtype: 'panel',
			region: 'north',
			html: 'Demonstration of a generic D3 bar chart.  Use the toolbar controls to invoke transitions',
			height: northPanelHeight,
			bodyStyle: {
				padding: '5px'
			}
		},
			Ext.create('App.view.viz.bar.VizPanel', {
				region: 'center',
				width: vizPanelWidth,
				height: vizPanelHeight,
				dataStore: movieStore
			}),
			Ext.create('App.view.viz.bar.GridPanel', {
				region: 'south',
				title: 'Movie Data',
				height: gridPanelHeight,
				store: movieStore
			}, me)
		];
		
		me.callParent(arguments);
	}
});