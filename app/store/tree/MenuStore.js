/**
 * @class
 * @memberOf App.store.tree
 * @extend Ext.data.TreeStore
 * @description Static store used in construction of Viz Menu
 */
Ext.define('App.store.tree.MenuStore', {
	extend: 'Ext.data.TreeStore',
	root: {
		expanded: true,
		children: [{
			text: 'D3',
			expanded: true,
			children: [{
				text: '<b>Bar Charts</b>',
				iconCls: 'icon-bar-chart',
				expanded: true,
				children: [{
					text: 'Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barMainPanel'	// widget ID
				}, {
					text: 'Bar Chart w/Legend',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barlegendMainPanel'
				}, {
					text: 'Stacked Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barstackMainPanel'
				}, {
					text: 'Stacked Bar Chart w/Legend',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barstackLegendMainPanel'
				}]
			}, {
				text: '<b>Pie Charts</b>',
				iconCls: 'icon-pie-chart',
				expanded: true,
				children: [{
					text: 'Pie Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pieMainPanel'
				}, {
					text: 'Pie Chart w/Legend',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pielegendMainPanel'
				}]
			}]
		}]
	}
});