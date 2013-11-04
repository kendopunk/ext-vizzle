Ext.require('App.util.GridRenderers');

/**
 * @class
 * @memberOf App.util
 * @description Common grid column definitions
 */
Ext.define('App.util.ColumnDefinitions', {
	statics: {
		movieTitle: {
			header: 'Title',
			dataIndex: 'title',
			width: 150,
			renderer: App.util.GridRenderers.wordWrap
		},
		
		// gross box office
		grossBO: {
			header: 'Gross',
			dataIndex: 'gross',
			renderer: App.util.GridRenderers.toWholeDollarCurrency
		},
		
		numTheaters: {
			header: '# Theaters',
			dataIndex: 'theaters',
			renderer: function(value) {
				return value.toLocaleString();
			}
		},
			
		// opening box office
		openingBO: {
			header: 'Opening Wknd',
			dataIndex: 'opening',
			renderer: App.util.GridRenderers.toWholeDollarCurrency
		},
		
		imdbRating: {
			header: 'IMDB Rating',
			dataIndex: 'imdbRating'
		},
		
		releaseDate: {
			header: 'Release Date',
			dataIndex: 'release'
		}
	}
});