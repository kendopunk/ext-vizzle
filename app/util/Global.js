/**
 * @class
 * @memberOf App.util
 * @description Global static and utility functions
 */
Ext.define('App.util.Global', {
	statics: {
		titlePanelHeight: 55,
		
		daaPanelHeight: 55,
		
		westPanelWidth: 235,
		
		defaultInfoMessage: 'Demonstrating various visualization libraries in ExtJS.  Heavy on the D3 side.',
		
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
			
			colorSchemes: [{
				name: 'Default',
				palette: 'default'
			}, {
				name: 'Earthy',
				palette: '20b'
			}, {
				name: 'Paired',
				palette: 'paired'
			}, {
				name: 'Gradient Blue',
				palette: 'gradient_blue'
			}, {
				name: 'Gradient Red',
				palette: 'gradient_red'
			}]
		},
		
		// lighten or darken a hex color
	    // @param color (with #)
	    // @param percent integer 0-100 (negative = darken)
	    // @return newColor
	    hexLightenDarken: function(color, percent) {
	    
	    	if(color[0] === '#') {
		    	color = color.substring(1);
		    }
	    
	    	var num = parseInt(color,16),
	    		amt = Math.round(2.55 * percent),
	    		R = (num >> 16) + amt,
	    		B = (num >> 8 & 0x00FF) + amt,
	    		G = (num & 0x0000FF) + amt;
	    		
	    		return (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
	    }
	}
});
