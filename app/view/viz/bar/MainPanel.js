Ext.define('App.view.viz.bar.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.app_view_viz_bar_mainpanel',
	title: 'Bar Chart',
	closable: true,
	
	bodyStyle: {
		padding: '5px'
	},
	
	layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		Ext.apply(me, {
			iconCls: 'icon-bar-chart'
		});
		
		me.items = [{
			xtype: 'panel',
			region: 'center',
			title: 'Viz',
			width: '50%',
			layout: 'fit',
			listeners: {
				afterrender: function(panel) {
						console.log(panel.getWidth());
						console.log(panel.getHeight());
				}
			}
		}, {
			xtype: 'panel',
			region: 'east',
			title: 'East',
			width: '50%',
			html: 'asdfasf'
		}];
				
		
		me.callParent(arguments);
	}
});