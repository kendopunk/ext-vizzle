Ext.Loader.setConfig({
	enabled: true
});

Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	enableQuickTips: true,
	
	/*
	controllers: [
		'Application'
	],
	*/
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Global',
		'App.util.MessageBus',
		'App.util.GridRenderers',
		'App.view.daa.TeamMatchup',
		'App.view.daa.Individual',
		'App.view.daa.Trending'
	],
	
	launch: function() {
		Ext.tip.QuickTipManager.init();
		
		Ext.create('Ext.container.Viewport', {		
			layout: 'border',
			items: [{
				xtype: 'panel',
				height: App.util.Global.daaPanelHeight,
				bodyStyle: {
					padding: '10px'
				},
				bodyCls: 'soccerHeader',
				html: 'Davidsonville Travel Soccer - Visual Statistics',
				region: 'north'
			}, {
				xtype: 'tabpanel',
				region: 'center',
				items: [{
					xtype: 'daaTeamMatchup',
				}, {
					xtype: 'daaIndividual'
				}, {	
					xtype: 'daaTrending'
				}]
				,activeTab: 1
			}]
		});

		if(Ext.get('page-loader')) {
			Ext.get('page-loader').remove();
		}
	}
});