/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.store.daa
 * @extend Ext.data.Store
 * @description Player data store
 */
Ext.define('App.store.daa.Players', {
	extend: 'Ext.data.Store',
	fields: [
		{name: 'name', type: 'string'},
		{name: 'color', type: 'string'},
		{name: 'gamesPlayed', type: 'auto'}
	],
	proxy: {
		type: 'ajax',
		url: 'data/daa/players.json',
		reader: {
			type: 'json',
			root: 'F14',
			successProperty: 'success'
		}
	}
});