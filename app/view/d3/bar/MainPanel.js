/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
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
	defaults: {
		split: true
	},
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Basic Bar Chart</b><br><br>'
			+ 'Movie data taken from <a href="http://www.imdb.com">IMDB</a> and <a href="http://www.boxofficemojo.com">Box Office Mojo</a>. '
			+ 'Tooltips from <a href="http://bl.ocks.org/milroc/2975255">milroc</a>.<br><br>'
			+ 'Use the toolbar buttons to view transitions.<br><br>'
			+ 'Employs the use of Ext.util.Observable subclass to handle messaging from the SVG visualization to the ExtJS framework (mouse over bar = grid row highlight)';
		
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
			layout: 'fit',
			autoScroll: true
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
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	}
});