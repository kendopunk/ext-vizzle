Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	controllers: [
		'Application'
	],
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global',
		'App.view.tree.MenuTreePanel'
	],
	
	launch: function() {
		Ext.create('Ext.container.Viewport', {
			layout: 'border',
			items: [{
				xtype: 'panel',
				height: 40,
				bodyStyle: {
					padding: '5px',
					'background-color': '#FFFFCC'
				},
				//html: '<b>D3 Visualizations in ExtJS</b>',
				html: '<b>This space for rent</b>',
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