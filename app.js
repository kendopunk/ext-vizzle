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
		
		// var defaultXType = null;
		// var defaultXType = 'areaGeneric';
		// var defaultXType = 'areaMultiPanel';
		// var defaultXType = 'areaTicker';
		// // var defaultXType = 'barBuild';
		var defaultXType = 'barGeneric';
		// var defaultXType = 'barGroup';
		// var defaultXType = 'barStack';
		// var defaultXType = 'barMouse';
		// var defaultXType = 'pieGeneric';
		// var defaultXType = 'pieBuild';
		// var defaultXType = 'geoPopulation';
		// var defaultXType = 'sunburstPartition';
		// var defaultXType = 'scatterGeneric';
		// var defaultXType = 'treemapFootball';
		// var defaultXType = 'treemapNetflow';
		// var defaultXType = 'timeline';
		// var defaultXType = 'slopeDebt';
		
		Ext.create('Ext.container.Viewport', {		
			layout: 'border',
			items: [{
				xtype: 'panel',
				height: App.util.Global.titlePanelHeight,
				bodyStyle: {
					padding: '5px'
				},
				bodyCls: 'northPanelCls',
				html: '<b>smarmless.com</b> - Visualizations in ExtJS',
				region: 'north',
				bbar: [{
					xtype: 'tbtext',
					text: 'ExtJS v4.0.7'
				},
					'-',
				{
					xtype: 'tbtext',
					text: 'D3 v3'
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
						window.location = 'http://www.smarmless.com';
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
						flex: 2,
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
					afterrender: function(tabpanel) {
						if(defaultXType) {
							this.addComponentByXType(tabpanel, defaultXType);
						}
					},
					// If there are no more tabs, then set the "Info" panel
					// message back to the globally-defined message
 					remove: function(tabPanel) {
						if(tabPanel.items.items.length == 0) {
							var eventRelay = Ext.create('App.util.MessageBus');
							eventRelay.publish(
								'infoPanelUpdate',
								App.util.Global.defaultInfoMessage
							);
						}
					},
					scope: this
				}
			}]
		});

		if(Ext.get('page-loader')) {
			Ext.get('page-loader').remove();
		}
	},
	
	/**
	 * @function
	 * @description Add a component to the tab panel directly via XTYPE
	 * @param component Object The component to which we add the xtype
	 * @param xtype String
	 */
	addComponentByXType: function(component, xtype) {
		var me = this;
		
		if(component === undefined || xtype == null || xtype === undefined) {
			return;
		}
		
		component.add({xtype: xtype});
	}
});
