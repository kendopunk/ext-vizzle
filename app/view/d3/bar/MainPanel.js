/**
 * @class
 * @memberOf App.view.d3.bar
 * @description Standard bar chart
 */
Ext.define('App.view.d3.bar.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.view.d3.bar.VizPanel',
		'App.view.d3.bar.GridPanel',
		'App.store.movie.MovieStore'
	],
	
	layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Bar Chart</b><br><br>'
			+ 'Demonstration of a generic D3 bar chart<br><br>'
			+ 'Movie data taken from <a href="http://www.imdb.com">IMDB</a> and <a href="http://www.boxofficemojo.com">Box Office Mojo</a><br><br>'
			+ 'Tooltips from <a href="http://bl.ocks.org/milroc/2975255">milroc</a><br><br>'
			+ 'Select different metrics from the combo to view dynamic transitions.<br><br>'
			+ 'Employs the use of Ext.util.Observable subclass to handle messaging from the SVG visualization to the ExtJS framework (mouse over bar = grid row highlight)';
		
		// layout vars
		me.gridPanelHeight = 250,
			me.vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width - 225
			),
			me.vizPanelHeight = parseInt(
				(Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- me.gridPanelHeight)
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
		
		// grid panel (south)
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
		
		// after render, publish update to the "Info" panel
		me.on('afterrender', function(panel) {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	}
});