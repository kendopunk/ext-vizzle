/**
 * @class
 * @memberOf App.store.movie
 * @extend Ext.data.Store
 * @decription Movie data store
 */
Ext.define('App.store.movie.MovieStore', {
	extend: 'Ext.data.Store',
	autoLoad: true,
	fields: [
		{name: 'title', type: 'string'},
		{name: 'gross', type: 'number'},
		{name: 'theaters', type: 'number'},
		{name: 'opening', type: 'number'},
		{name: 'release', type: 'int'},
		{name: 'imdbRating', type: 'float'}
	],
	proxy: {
		type: 'ajax',
		url: 'data/movie_data.json',
		reader: {
			type: 'json',
			root: 'data',
			successProperty: 'success'
		}
	}
});