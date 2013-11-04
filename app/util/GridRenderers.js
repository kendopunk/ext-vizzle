/**
 * @class
 * @memberOf App.util
 * @description Common grid rendering functions
 */
Ext.define('App.util.GridRenderers', {
	statics: {
		emptyValueMarker: '--',
		
		toCurrency: function(num) {
			if(!isNaN(num)) {
				return Ext.util.Format.currency(num, '$', false, false);
			}
			return this.emptyValueMarker;
		},
		
		toWholeDollarCurrency: function(num) {
			if(!isNaN(num)) {
				return Ext.util.Format.currency(num, false, '0', false);
			}
			return this.emptyValueMarker;
		},
		
		// wrap text
		wordWrap: function(value) {
			return '<div style="white-space:normal !important">' + value + '</div>';
		}
	}
});