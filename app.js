Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global'
	],
	
	launch: function() {
		Ext.create('Ext.container.Viewport', {
			layout: 'fit',
			items: [{
				xtype: 'panel',
				title: 'asdfasf'
			}]
		})
	}
});