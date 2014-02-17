/*
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.tree
 * @description Menu tree panel for selecting viz examples
 */
Ext.define('App.view.tree.MenuTreePanel', {
	extend: 'Ext.tree.Panel',
	requires: [
		'App.store.tree.MenuStore'
	],
	autoScroll: true,
	frame: false,
	border: false,
	width: 200,
	title: 'Menu Tree Panel',
	store: Ext.create('App.store.tree.MenuStore'),
	rootVisible: false,
	initComponent: function() {
		var me = this;
		
		me.callParent(arguments);
	}
});