/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.tree
 * @description Utility info panel in west of viewport
 */
Ext.define('App.view.tree.MenuInfoPanel', {
	extend: 'Ext.Panel',
	title: 'Info',
	
	requires: [
		'App.util.MessageBus'
	],
	
	initComponent: function() {
		var me = this;
		
		me.eventRelay = Ext.create('App.util.MessageBus');
 		me.eventRelay.subscribe('infoPanelUpdate', me.updateInfo, me);
		
		me.callParent(arguments);
	},
	
	updateInfo: function(message) {
		var me = this;
		
		if(message) {
			me.update(message);
		}
	}
});