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
				(Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- northPanelHeight
					- gridPanelHeight)
			);
			
		// shared store
		movieStore = Ext.create('App.store.movie.MovieStore');
		
		// add items
		me.items = [{
			xtype: 'panel',
			region: 'north',
			html: 'Demonstration of a generic D3 bar chart.  Movie data courtesy of <a href="http://www.imdb.com">IMDB</a> and <a href="http://www.boxofficemojo.com">Box Office Mojo</a>. Tooltips from <a href="http://bl.ocks.org/milroc/2975255">milroc</a>.  Select different metrics from the combo to view dynamic transitions.  Employs the use of Ext.util.Observable subclass to handle messaging from the SVG visualization to the ExtJS framework (mouse over bar = grid row highlight)',
			height: northPanelHeight,
			bodyStyle: {
				padding: '5px'
			}
		},
			Ext.create('App.view.d3.bar.VizPanel', {
				region: 'center',
				width: vizPanelWidth,
				height: vizPanelHeight,
				dataStore: movieStore
			}),
			Ext.create('App.view.d3.bar.GridPanel', {
				region: 'south',
				title: 'Movie Datalkjlkj',
				height: gridPanelHeight,
				store: movieStore
			}, me)
		];
		
		me.callParent(arguments);
	}
});