Ext.define('App.controller.Application', {
	extend: 'Ext.app.Controller',
	
	requires: [
		'App.view.viz.bar.MainPanel'
	],
	
	init: function() {
		var me = this;
		
		me.control({
			'viewport > treepanel': {
				'itemclick': me.treePanelItemClick,
			},
			scope: me
		});
	
	},
	
	/**
	 * @function
	 * @memberOf App.controller.Application
	 * @param view Ext.view.View
	 * @param record Ext.data.Model
	 * @param item HTMLElement
	 * @param index int
	 * @param e Ext.EventObject
	 * @pararm eOpts Object
	 */
	treePanelItemClick: function(view, record, item, index, e, eOpts) {
		// leaf only
		if(!record.data.leaf) {
			return;
		}
		
		// find the viewport tab panel
		var tabPanel = Ext.ComponentQuery.query('viewport > tabpanel');
		if(tabPanel[0]) {
			
			// already have this tab?
			var match = tabPanel[0].query(record.data.id);
			if(match.length) {
				tabPanel[0].setActiveTab(match[0]);
				return;
			} else {
				
				var cmp = tabPanel[0].add({
					xtype: record.data.id,
					title: record.data.text
				});
				
				tabPanel[0].setActiveTab(cmp);
			}
		}
	}
});