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
					text: 'Mouse Events',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'battleMainPanel'
				}, {
					text: 'Grouped Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'bargroupMainPanel'
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
					text: 'Stacked Bar Orientation',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'hozBarStackMainPanel'
				}, {
					text: 'Build-A-Bar',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'buildabarMainPanel'
				}]
			}, {
				text: '<b>Pie Charts</b>',
				expanded: true,
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
				},  {
					text: 'Radial Tree/Sunburst',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'sunburstPartition'
				}]
			}, {
				text: '<b>Geo</b>',
				expanded: true,
				iconCls: 'icon-globe',
				children: [{
					text: 'Basic Geo',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'geoBasicMainPanel'
				}]
			}, {
				text: '<b>Misc</b>',
				expanded: true,
				iconCls: 'icon-scatterplot',
				children: [{
					text: 'Basic Scatterplot',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'scatterMainPanel'
				}, {
					text: 'Basic Treemap',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'treemapBasicMainPanel'
				}, {
					text: 'Heat Treemap',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'treemapHeatMainPanel'
				}, {
					text: 'Slopegraph',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'debtSlopeMainPanel'
				}, {
					text: 'Line/Area Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaMainPanel'
				}, {
					text: 'Multiline Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaMultiPanel'
				}, {
					text: 'Area "Ticker"',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'tickerMainPanel'
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