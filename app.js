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
		'App.view.tree.MenuTreePanel',
		'App.view.tree.MenuInfoPanel'
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
			}, {
				xtype: 'panel',
				layout: 'vbox',
				width: App.util.Global.westPanelWidth,
				items: [ 
					Ext.create('App.view.tree.MenuTreePanel', {
						height: App.util.Global.treePanelHeight,
						title: 'Viz Menu',
						height: 350,
						width: '100%',
						flex: 1,
						autoScroll: true,
						frame: false
					}),
					Ext.create('App.view.tree.MenuInfoPanel', {
						title: 'Info',
						bodyStyle: {
							padding: '5px'
						},
						html: 'FOO...',
						layout: 'fit',
						width: '100%',
						flex: 1,
						autoScroll: true
					})
				],
				region: 'west'
			}, 
			{
				xtype: 'tabpanel',
				width: Ext.getBody().getViewSize().width - App.util.Global.treePanelWidth,
				plain: true,
				region: 'center'
			}]
		})
	}
});