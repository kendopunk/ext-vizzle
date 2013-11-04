Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	controllers: [
		'Application'
	],
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global',
		'App.util.GridRenderers',
		'App.util.ColumnDefinitions',
		'App.view.tree.MenuTreePanel'
	],
	
	launch: function() {
		Ext.create('Ext.container.Viewport', {
			layout: 'border',
			items: [{
				xtype: 'panel',
				height: App.util.Global.titlePanelHeight,
				bodyStyle: {
					padding: '5px',
					'background-color': 'NavajoWhite'
				},
				html: '<b>ExtJS Visualization Examples (D3, et. al.)</b>',
				region: 'north'
			}, 
				Ext.create('App.view.tree.MenuTreePanel', {
					width: App.util.Global.treePanelWidth,
					title: 'Menu',
					region: 'west'
				}),
			{
				xtype: 'tabpanel',
				width: Ext.getBody().getViewSize().width - App.util.Global.treePanelWidth,
				plain: true,
				region: 'center',
				items: [{
					xtype: 'panel',
					title: 'Info',
					closable: false
				}]
			}]
		})
	}
});