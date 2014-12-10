Ext.Loader.setConfig({
	enabled: true
});

Ext.application({
	name: 'App',
	
	appFolder: 'app',
	
	enableQuickTips: true,
	
	requires: [
		'Ext.container.Viewport',
		'App.util.Env',
		'App.util.Global',
		'App.util.MessageBus',
		'App.util.GridRenderers',
		'App.view.daa.Conditioning',
		'App.view.daa.ConditioningTwo',
		'App.view.daa.TeamMatchup',
		'App.view.daa.Individual',
		'App.view.daa.Trending',
		'App.view.daa.StatsByGame'
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
				html: 'DAA Gators \'03-\'04 Visual Stats',
				region: 'north'
			}, {
				xtype: 'tabpanel',
				region: 'center',
				items: [{
					xtype: 'daaTeamMatchup',
				}, {
					xtype: 'daaStatsByGame'
				}, {
					xtype: 'daaIndividual'
				}, {	
					xtype: 'daaTrending'
				}, {
					xtype: 'daaConditioningOne'
				}, {
					xtype: 'daaConditioningTwo'
				}]
				//,activeTab: 2
			}]
		});

		if(Ext.get('page-loader')) {
			Ext.get('page-loader').remove();
		}
	}
});
