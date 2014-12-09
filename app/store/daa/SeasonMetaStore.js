/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.store.daa
 * @extend Ext.data.Store
 * @description Soccer season store
 */
Ext.define('App.store.daa.SeasonMetaStore', {
	extend: 'Ext.data.Store',
	fields: [
		{name: 'id', type: 'string'},
		{name: 'seasonId', type: 'string'},
		{name: 'seasonYear', type: 'number'},
		{name: 'seasonName', type: 'string'},
		{name: 'seasonSeason', type: 'string'},
		{name: 'wins', type: 'number'},
		{name: 'losses', type: 'number'},
		{name: 'ties', type: 'number'}
	],
	constructor: function(conf) {
		if(conf && conf.url && !conf.proxy) {
			 conf.proxy = {
			 	type: 'ajax',
			 	url: conf.url,
			 	reader: {
				 	type: 'json'
				}
			 }
		}
		
		this.callParent(arguments);
	}
});