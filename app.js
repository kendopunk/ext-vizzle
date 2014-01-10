Ext.Loader.setConfig({
	enabled: true
});

Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	enableQuickTips: true,
	
	controllers: [
		'Application'
	],
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global',
		'App.util.MessageBus',
		'App.util.GridRenderers',
		'App.view.tree.MenuTreePanel',
		'App.view.tree.MenuInfoPanel'
	],
	
	launch: function() {
		Ext.tip.QuickTipManager.init();
		
		Ext.create('Ext.container.Viewport', {
			layout: 'border',
			items: [{
				xtype: 'panel',
				height: App.util.Global.titlePanelHeight,
				bodyStyle: {
					padding: '5px'
				},
				bodyCls: 'northPanelCls',
				contentEl: 'header',
				region: 'north',
				bbar: [{
					xtype: 'tbtext',
					text: 'ExtJS v4.0.7'
				},
					'->',
				{
					xtype: 'button',
					text: 'kendopunk@hotmail.com',
					href: 'mailto:kendopunk@hotmail.com',
					iconCls: 'icon-email-send'
				}, 
					'-',
				{
					xtype: 'button',
					text: 'smarmless.com',
					handler: function() {	
						if(location.host == 'localhost:8080') {
							window.location = '../';
						}
					}
				},
				{
					xtype: 'tbspacer',
					width: 5
				}]
			}, {
				xtype: 'panel',
				layout: 'vbox',
				width: App.util.Global.westPanelWidth,
				items: [ 
					Ext.create('App.view.tree.MenuTreePanel', {
						height: App.util.Global.treePanelHeight,
						title: 'Viz Menu',
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
						html: App.util.Global.defaultInfoMessage,
						layout: 'fit',
						width: '100%',
						flex: 1,
						autoScroll: true
					})
				],
				region: 'west'
			}, {
				xtype: 'tabpanel',
				width: Ext.getBody().getViewSize().width - App.util.Global.treePanelWidth,
				plain: true,
				region: 'center',
				listeners: {
					/**
					 * If there are no more tabs, then set the "Info" panel
					 * message back to the globally-defined message
					 */
 					remove: function(tabPanel) {
						if(tabPanel.items.items.length == 0) {
							var eventRelay = Ext.create('App.util.MessageBus');
							eventRelay.publish(
								'infoPanelUpdate',
								App.util.Global.defaultInfoMessage
							);
						}
					}
				}
			}]
		})
	}
});
