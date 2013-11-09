/**
 * @class
 * @memberOf App.util
 * @description Global static and utility functions
 */
Ext.define('App.util.Global', {

	statics: {
		titlePanelHeight: 40,
		
		westPanelWidth: 225,
		
		defaultInfoMessage: 'Demonstration of various visualization libraries in ExtJS',
		
		svg: {
			wholeDollarTickFormat: function(d) {
				return Ext.util.Format.currency(d, false, '0', false);
			},
			
			numberTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000');
			}
		}
	}
});