Ext.define('App.view.tree.MenuTreePanel', {
	extend: 'Ext.tree.Panel',
	requires: [
		'App.store.tree.MenuStore'
	],
	autoScroll: true,
	width: 200,
	title: 'Menu Tree Panel',
	bodyStyle: {
		padding: '5px'
	},
	store: Ext.create('App.store.tree.MenuStore'),
	rootVisible: false,
	initComponent: function() {
		var me = this;
		
		me.callParent(arguments);
	}
});