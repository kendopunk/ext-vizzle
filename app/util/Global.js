/**
 * @class
 * @memberOf App.util
 * @description Global static and utility functions
 */
Ext.define('App.util.Global', {
	statics: {
		titlePanelHeight: 55,
		
		westPanelWidth: 235,
		
		defaultInfoMessage: 'Demonstration of various visualization libraries in ExtJS.',
		
		svg: {
			currencyTickFormat: function(d) {
				return Ext.util.Format.currency(d);
			},
			
			numberTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000');
			},
			
			percentTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000.0') + '%';
			},
			
			wholeDollarTickFormat: function(d) {
				return Ext.util.Format.currency(d, false, '0', false);
			},
		}
	}
});
