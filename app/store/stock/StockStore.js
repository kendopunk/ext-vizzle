/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.store.stock
 * @extend Ext.data.Store
 * @description Stock data store
 */
Ext.define('App.store.stock.StockStore', {
	extend: 'Ext.data.Store',
	fields: [
		{name: 'ticker', type: 'string'},
		{name: 'name', type: 'string'},
		{name: 'price', type: 'float'},
		{name: 'change', type: 'float'},
		{name: 'pctChange', type: 'float'}
	],
	proxy: {
		type: 'ajax',
		url: 'data/stock_data.json',
		reader: {
			type: 'json',
			root: 'data',
			successProperty: 'success'
		}
	}
});