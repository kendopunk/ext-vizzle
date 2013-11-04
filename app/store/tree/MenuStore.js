Ext.define('App.store.tree.MenuStore', {
	extend: 'Ext.data.TreeStore',
	root: {
		expanded: true,
		children: [{
			text: '<b>Bar Charts</b>',
			iconCls: 'icon-bar-chart',
			expanded: true,
			children: [{
				text: 'Bar Chart',
				leaf: true,
				iconCls: 'icon-arrow-right',
				id: 'app_view_viz_bar_mainpanel'
			}, {
				text: 'Bar Chart w/Legend',
				leaf: true,
				iconCls: 'icon-arrow-right'
			}]
		}, {
			text: '<b>Pie Charts</b>',
			iconCls: 'icon-pie-chart',
			expanded: true,
			children: [{
				text: 'Pie Chart',
				leaf: true,
				iconCls: 'icon-arrow-right'
			}, {
				text: 'Pie Chart w/Legend',
				leaf: true,
				iconCls: 'icon-arrow-right'
			}]
		}]
	}
});