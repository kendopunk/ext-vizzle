/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.store.tree
 * @extend Ext.data.TreeStore
 * @description Static store used in construction of Viz Menu
 */
Ext.define('App.store.tree.MenuStore', {
	extend: 'Ext.data.TreeStore',
	root: {
		expanded: true,
		children: [{
			text: 'd3.js',
			expanded: true,
			children: [{
				text: '<b>Bar Charts</b>',
				iconCls: 'icon-bar-chart',
				expanded: true,
				children: [{
					text: 'Basic Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barMainPanel'	// widget ID
				}, {
					text: 'Bar Chart ++',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barlegendMainPanel'
				}, {
					text: 'Stacked Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barstackMainPanel'
				}, {
					text: 'Stacked Bar ++',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barstackLegendMainPanel'
				}, {
					text: 'Build-A-Bar',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'buildabarMainPanel'
				}]
			}, {
				text: '<b>Pie Charts</b>',
				//expanded: true,
				iconCls: 'icon-pie-chart',
				children: [{
					text: 'Pie Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pieMainPanel'
				}, {
					text: 'Pie Chart ++',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pielegendMainPanel'
				}, {
					text: 'Build-A-Pie',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'buildapieMainPanel'
				}]
			}, {
				text: '<b>Line/Area Charts</b>',
				//expanded: true,
				iconCls: 'icon-area-chart',
				children: [{
					text: 'Basic Line/Area',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaMainPanel'
				}, {
					text: '"Ticker"',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'tickerMainPanel'
				}]
			}, {
				text: '<b>Scatterplots</b>',
				//expanded: true,
				iconCls: 'icon-scatterplot',
				children: [{
					text: 'Basic Scatter',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'scatterMainPanel'
				}]
			}]
		}, {
			text: 'Chart.js',
			expanded: true,
			children: [{
				text: 'Multiple Examples',
				leaf: true,
				iconCls: 'icon-arrow-right',
				id: 'chartMiscMainPanel'
			}]
		}, {
			text: 'Fabric.js',
			expanded: true,
			children: [{
				text: 'Basic Examples',
				leaf: true,
				iconCls: 'icon-arrow-right',
				id: 'fabricBasicMainPanel'
			}]
		}]
	}
});
