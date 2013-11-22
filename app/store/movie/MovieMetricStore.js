/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.store.movie
 * @extend Ext.data.Store
 * @decription Store to hold movie metric selections (gross, theaters, etc)
 */
Ext.define('App.store.movie.MovieMetricStore', {
	extend: 'Ext.data.Store',
	autoLoad: true,
	fields: [
		{name: 'display', type: 'string'},
		{name: 'value', type: 'string'}
	],
	proxy: {
		type: 'ajax',
		url: 'data/movie_metrics_data.json',
		reader: {
			type: 'json',
			root: 'data',
			successProperty: 'success'
		}
	}
});