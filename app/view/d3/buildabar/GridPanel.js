/**
 * @class
 * @memberOf App.view.d3.buildabar
 * @description SVG panel
 * @extend Ext.panel.Panel
 */
Ext.define('App.view.d3.buildabar.GridPanel', {
	extend: 'Ext.grid.Panel',
	plain: true,
	autoScroll: true,
	title: 'Grid',
	multiSelect: true,
	
	requires: [
		'App.store.stock.StockStore'
	],
	
	stripeRows: true,
	
	enableDragDrop: true,
	
	viewConfig: {
		plugins: {
			ptype: 'gridviewdragdrop',
			ddGroup: 'vizPanelDDGroup',
			enableDrop: false
		}
	},
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @property
 		 */
 		me.eventRelay = Ext.create('App.util.MessageBus');
 		me.eventRelay.subscribe('BuildABarPanelRendered', me.loadGridStore, me);
 		
		/**
		 * @property
		 * @description Grid store
		 */
		me.store = Ext.create('App.store.stock.StockStore');
		 
		/**
 		 * @property
 		 * @description Column definitions
 		 */
 		me.columns = [
 			App.util.ColumnDefinitions.tickerSymbol,
 			App.util.ColumnDefinitions.tickerPrice,
 			App.util.ColumnDefinitions.tickerChange,
 			//App.util.ColumnDefinitions.tickerName,
 			App.util.ColumnDefinitions.tickerPctChange
		];
		
		me.callParent(arguments);
	},
	
	loadGridStore: function() {
		var me = this;
		
		me.store.load();
	}
});