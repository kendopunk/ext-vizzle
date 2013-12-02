Ext.require('App.util.GridRenderers');

/**
 * @class
 * @memberOf App.util
 * @description Common grid column definitions
 */
Ext.define('App.util.ColumnDefinitions', {
	statics: {
		grossBO: {
			header: 'Gross',
			dataIndex: 'gross',
			renderer: App.util.GridRenderers.toWholeDollarCurrency
		},
		
		imdbRating: {
			header: 'IMDB Rating',
			dataIndex: 'imdbRating'
		},
		
		movieTitle: {
			header: 'Title',
			dataIndex: 'title',
			width: 150,
			renderer: App.util.GridRenderers.wordWrap
		},
		
		numTheaters: {
			header: '# Theaters',
			dataIndex: 'theaters',
			renderer: function(value) {
				return value.toLocaleString();
			}
		},
		
		openingBO: {
			header: 'Opening Wknd',
			dataIndex: 'opening',
			renderer: App.util.GridRenderers.toWholeDollarCurrency
		},
		
		releaseDate: {
			header: 'Release Date',
			dataIndex: 'release',
			renderer: function(value, meta) {
				//meta.style = 'background-color:#FFC';
				return value;
			}
			/*,
			editor: {
				xtype: 'textfield',
				allowBlank: false
			}
			*/
		},
		
		tickerChange: {
			header: 'Change',
			dataIndex: 'change',
			renderer: function(v) {
				if(isNaN(parseFloat(v))) {
					return '--';
				}
				if(parseFloat(v) > 0) {
					return '+' + Ext.util.Format.number(v, '0,0.00');
				} else {
					return Ext.util.Format.number(v, '0,0.00');
				}
			}
		},
		
		tickerName: {
			header: 'Name',
			dataIndex: 'name', 
			renderer: function(v) {
				return '<b>' + v + '</b>';
			}
		},
		
		tickerPctChange: {
			header: '% Change',
			dataIndex: 'pctChange',
			renderer: function(v) {
				return Ext.util.Format.number(v, '0,0.00') + '%';
			}
		},
		
		tickerPrice: {
			header: 'Close Price',
			dataIndex: 'price',
			renderer: function(v) {
				if(isNaN(parseFloat(v))) {
					return '--';
				}
				return Ext.util.Format.currency(v);
			}
		},
		
		tickerSymbol: {
			header: 'Ticker',
			width: 75,
			dataIndex: 'ticker',
			renderer: function(v) {
				return '<b>' + v + '</b>';
			}
		}
	}
});