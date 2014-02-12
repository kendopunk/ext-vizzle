/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.controller
 */
Ext.define('App.controller.Application', {
	extend: 'Ext.app.Controller',
	
	requires: [
		'App.view.chart.misc.MainPanel',
		'App.view.d3.area.MainPanel',
		'App.view.d3.bar.MainPanel',
		'App.view.d3.bargroup.MainPanel',
		'App.view.d3.barlegend.MainPanel',
		'App.view.d3.barstack.MainPanel',
		'App.view.d3.barstacklegend.MainPanel',
		'App.view.d3.buildabar.MainPanel',
		'App.view.d3.buildapie.MainPanel',
		'App.view.d3.geo.basic.MainPanel',
		'App.view.d3.hozbarstack.MainPanel',
		'App.view.d3.pie.MainPanel',
		'App.view.d3.pielegend.MainPanel',
		'App.view.d3.scatterbrush.MainPanel',
		'App.view.d3.scatterplot.MainPanel',
		'App.view.d3.ticker.MainPanel',
		'App.view.d3.treemap.basic.MainPanel',
		'App.view.d3.treemap.heat.MainPanel',
		'App.view.fabric.basic.MainPanel'
	],
	
	init: function() {
		var me = this;
		
		me.control({
			'viewport > panel > treepanel': {
				itemclick: me.treePanelItemClick
			},
			scope: me
		})
	},
	
	/**
 	 * @function
 	 * @memberOf App.controller.Application
 	 * @param view Ext.view.View
 	 * @param record Ext.data.Model
 	 * @param item HTMLElement
 	 * @param index Number
 	 * @param e Ext.EventObject
 	 * @param eOpts Object
 	 */
 	treePanelItemClick: function(view, record, item, index, e, eOpts) {

 		// ignore leaves
 		if(!record.data.leaf) {
	 		return;
	 	} else {
	 		var tabPanel = Ext.ComponentQuery.query('viewport > tabpanel');
	 		if(tabPanel[0]) {
	 			
	 			// Check for presence by querying xtype of panel
	 			var match = tabPanel[0].query(record.data.id);
	 			if(match[0]) {
	 				tabPanel[0].setActiveTab(match[0]);
	 				return;
	 			} else {
	 				var addedCmp = tabPanel[0].add({
	 					xtype: record.data.id,
	 					title: record.data.text
	 				});
	 				tabPanel[0].setActiveTab(addedCmp);
	 			}
	 		}
	 	}
 	}
});
