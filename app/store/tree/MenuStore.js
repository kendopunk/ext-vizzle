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
					text: 'Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barGeneric'	// widget ID
				}, {
					text: 'Build-A-Bar',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barBuild'
				}, {
					text: 'Grouped Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barGroup'
				}, {
					text: 'Stacked Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barStack'
				}, {
					text: 'Mouse Events',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'barMouse'
				}]
			}, {
				text: '<b>Pie Charts</b>',
				expanded: true,
				iconCls: 'icon-pie-chart',
				children: [{
					text: 'Pie Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pieGeneric'
				}, {
					text: 'Build-A-Pie',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'pieBuild'
				},  {
					text: 'Radial Tree/Sunburst',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'sunburstPartition'
				}]
			}, {
				text: '<b>Line Charts</b>',
				expanded: true,
				iconCls: 'icon-line-chart',
				children: [{
					text: 'Line/Area Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaGeneric'
				}, {
					text: 'Line "Ticker" Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaTicker'
				}, {
					text: 'Multiline Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'areaMultiPanel'
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
				}, {
					text: 'World Population Stats',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'geoPopulation'
				}]
			}, {
				text: '<b>Misc</b>',
				expanded: true,
				iconCls: 'icon-scatterplot',
				children: [{
					text: 'Scatterplot',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'scatterGeneric'
				}, {
					text: 'Timeline',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'timeline'
				}, {
					text: 'Treemap, Basic',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'treemapFootball'
				}, {
					text: 'Treemap, Heat',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'treemapNetflow'
				}, /*{
					text: 'Treemap, Zoomable',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'treemapUnsec'
				}, */{
					text: 'Slopegraph',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'slopeDebt'
				}]
			}, {
				text: '<b>Responsive</b>',
				expanded: true,
				iconCls: 'icon-star',
				children: [{
					text: 'Responsive Bar Chart',
					leaf: true,
					iconCls: 'icon-arrow-right',
					id: 'win_responsiveBar'
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