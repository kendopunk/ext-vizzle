/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Stacked bar chart
 */
Ext.define('App.view.d3.bar.StackedBar', {
	extend: 'Ext.Panel',
	alias: 'widget.barStack',
	title: 'Stacked Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalStackedBar'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.rawData = [],
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.stackedBarChart = null,
 			me.currentMetric = 'total',
 			me.currentDataSource = 'armor',
 			me.dataHelpers = {
	 			armor: {
		 			title: 'German Tank Production in WWII (1939-1944)'
		 		},
		 		aircraft: {
		 			title: 'German Aircraft Production in WWII (1939-1944)'
		 		}
		 	};
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		me.chartDescription = '<b>Stacked Bar Chart with Orientation Support</b><br><br>'
			+ '<i>Horizontal / vertical toggling...use "Customize" menu.</i><br><br>'
			+ 'Took me a while to figure this out...but you can keep the '
			+ 'd3.layout.stack() call in place (like the vertical stacked bar chart) '
			+ 'and just get creative with the X and Y scales/axes.<br><br>'
			+ 'Handles zero-value slices well (no Tiger I&#039;s produced 1939-1941, no '
			+ 'Panzer V&#039s between 1939-1942)<br><br>'
			+ 'Data from Wikipedia.  <i>Panzer</i> is German for "tank" or "armor".';
			
		me.eventRelay = Ext.create('App.util.MessageBus');
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		////////////////////////////////////////
		// LABEL, TOOLTIP, LEGEND functions
		////////////////////////////////////////
 		me.productionLabelFn = function(data, index) {
 			if(data.y == 0) {
	 			return '';
	 		}
	 		return Ext.util.Format.number(data.y, '0,000');
	 	};
		me.pctLabelFn = function(data, index) {
			if(data.y == 0) {
				return '';
			}
			return Ext.util.Format.number(data.y, '0.0') + '%';
		};
		
		me.productionTooltipFn = function(data, index) {
			return '<b>' + data.category + '</b><br>'
				+ Ext.util.Format.number(data.y, '0,000') + ' ' + data.id + '&#039;s';
		};
		me.percentTooltipFn = function(data, index) {
			return '<b>' + data.category + '</b><br>'
				+ Ext.util.Format.number(data.y, '0.00') + '% of<br>'
				+ data.id + ' production.';
		};
		
 		me.productionTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000');
		};
		
		me.percentTickFormat = function(d) {
			return Ext.util.Format.number(d, '0') + '%';
		};
		
		/**
		 * @property
		 */
 		me.valignCombo = Ext.create('Ext.form.field.ComboBox', {
	 		store: Ext.create('Ext.data.SimpleStore', {
				fields: ['value'],
				data: [
					['top'],
					['middle'],
					['bottom']
				]
			}),
			displayField: 'value',
	 		valueField: 'value',
	 		editable: false,
		 	typeAhead: true,
		 	queryMode: 'local',
		 	triggerAction: 'all',
		 	width: 75,
		 	listWidth: 75,
		 	value: 'middle',
		 	listeners: {
			 	select: function(combo) {
				 	me.stackedBarChart.setLabelVAlign(combo.getValue());
				 	me.stackedBarChart.draw();
			 	},
			 	scope: me
			}
		});
		
		////////////////////////////////////////////
		// TOOLBAR COMPONENTS
		////////////////////////////////////////////
 		var colorSchemeMenu = Ext.Array.map(App.util.Global.svg.colorSchemes, function(obj) {
	 		return {
		 		text: obj.name,
		 		handler: function(btn) {
			 		me.stackedBarChart.setColorPalette(obj.palette);
			 		me.stackedBarChart.draw();
			 	},
			 	scope: me
			}
		}, me);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Type:</b>'
			}, {
				xtype: 'combo',
				store: Ext.create('Ext.data.SimpleStore', {
					fields: ['display', 'value'],
					data: [
						['Tanks', 'armor'],
						['Aircraft', 'aircraft']
					]
				}),
				displayField: 'display',
				valueField: 'value',
				value: 'armor',
				editable: false,
				queryMode: 'local',
				triggerAction: 'all',
				width: 100,
				listWidth: 100,
				listeners: {
					select: function(combo) {
						me.currentDataSource = combo.getValue();
						me.dataSourceHandler();
					},
					scope: me
				}
			}, {
				xtype: 'tbspacer',
				width: 20
			}, {
				xtype: 'tbtext',
				text: '<b>Production:</b>'
			}, {
				xtype: 'button',
				text: 'Total',
				metric: 'total',
				itemId: 'totalBtn',
				cls: me.btnHighlightCss,
				handler: function(btn) {
					btn.addCls(me.btnHighlightCss);
					me.down('#percentBtn').removeCls(me.btnHighlightCss);
					me.metricHandler(btn.metric);
				},
				scope: me
			},
			'-',
			{
				xtype: 'button',
				text: '%',
				metric: 'percent',
				itemId: 'percentBtn',
				handler: function(btn) {
					btn.addCls(me.btnHighlightCss);
					me.down('#totalBtn').removeCls(me.btnHighlightCss);
					me.metricHandler(btn.metric);
				},
				scope: me
			}, {
				xtype: 'tbspacer',
				width: 20
			}, {
				xtype: 'button',
				iconCls: 'icon-tools',
				text: 'Customize',
				menu: [{
					xtype: 'menucheckitem',
					text: 'Labels',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.stackedBarChart.setShowLabels(checked);
							me.stackedBarChart.draw();
						},
						scope: me
					}
				}, {
					xtype: 'menucheckitem',
					text: 'Legend',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.stackedBarChart.setShowLegend(checked);
							me.stackedBarChart.draw();
						},
						scope: me
					}
				}, {
					text: 'Vertical',
					tooltip: 'Vertical',
					iconCls: 'icon-bar-chart',
					orientationValue: 'vertical',
					handler: me.orientationHandler,
					scope: me
				}, {
					text: 'Horizontal',
					tooltip: 'Horizontal',
					iconCls: 'icon-bar-chart-hoz',
					orientationValue: 'horizontal',
					handler: me.orientationHandler,
					scope: me
				}, {
					text: 'Color Scheme',
					iconCls: 'icon-color-wheel',
					menu: {
						xtype: 'menu',
						items: colorSchemeMenu
					}
				}]	
			}]
		}];
		
		/**
 		 * @listener
 		 * @description After render, initialize the canvas
 		 */
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		/**
 		 * @listener
 		 * @description On activate, publish a new message to the "Info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.bar.StackedBar
 	 * @description Initialize the drawing canvas
 	 */
 	initCanvas: function() {
 		var me = this;
 		
 		me.getEl().mask('Loading...');
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.UniversalStackedBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			colorScale: d3.scale.category20(),
			panelId: me.panelId,
			chartFlex: 4,
			legendFlex: 1,
			margins: {
				top: 40,
				right: 15,
				bottom: 50,
				left: 115
			},
			tooltipFunction: me.productionTooltipFn,
			xTickFormat: me.productionTickFormat,
			chartTitle: me.dataHelpers[me.currentDataSource].title,
			showLabels: true,
			showLegend: true,
			spaceBetweenChartAndLegend: 30,
			labelFunction: me.productionLabelFn,
			colorPalette: '20b'
		});
		
		// retrieve the graph data via AJAX and load the visualization
		Ext.Ajax.request({
			url: 'data/german_ww2.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.rawData = resp;
	 			me.graphData = resp.armor.data;
		 		me.stackedBarChart.setGraphData(me.graphData);
		 		me.stackedBarChart.initChart().draw();
		 	},
		 	callback: function() {
			 	me.getEl().unmask();
			},
		 	scope: me
		 });
 	},
  	
  	/**
	 * @function
	 * @memberOf App.view.d3.bar.StackedBar
	 * @description Changing up metrics
	 * @param metric String
	 */
	metricHandler: function(metric) {
		var me = this;
		
		me.currentMetric = metric;
		
		var dataSet = Ext.clone(me.graphData);
		
		if(metric == 'percent') {
			dataSet = me.normalizePercent(dataSet);
			
			me.stackedBarChart.setLabelFunction(me.pctLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.percentTooltipFn);
			
			if(me.stackedBarChart.chartOrientation == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.percentTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.percentTickFormat);
			}
			
		} else {
			me.stackedBarChart.setLabelFunction(me.productionLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.productionTooltipFn);
			
			if(me.stackedBarChart.chartOrientation == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.productionTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.productionTickFormat);
			}
		}
		
		me.stackedBarChart.draw();
	},
  
   	/**
     * @function
     * @description Convert graph data to percent layout
     */
    normalizePercent: function(normalizedData) {
    	
    	var me = this;
    	
    	var idTotals = [],
			uniqueIds = [];
		
		// retrieve unique ID values from the first array
	  	Ext.each(normalizedData[0].values, function(obj) {
	  		uniqueIds.push(obj.id);
	  		idTotals.push(0);
	  	});
	  	
	  	// run through the data and sum up totals per ID
	  	for(var i=0; i<normalizedData.length; i++) {
		  	var plucked = Ext.pluck(normalizedData[i].values, 'y'),
		  		j = 0;
			
			plucked.map(function(el) {
				idTotals[j] += el;
				j++;
			});
		}
		
		// now, run through the normalized data again and calculate
		// percentage
		Ext.each(normalizedData, function(obj) {
			var ind = 0;
			
			Ext.each(obj.values, function(item) {
				item.y = (item.y/idTotals[ind] * 100);
				ind++;
			});
		});
		
		return normalizedData;
   	},
	
	/**
 	 * @function
 	 * @description Change the stacked bar orientation (horizontal | vertical)
 	 */
	orientationHandler: function(btn) {
		var me = this;
	
		me.stackedBarChart.setOrientation(btn.orientationValue);
		
		// tick formats
		if(me.currentMetric == 'percent') {
			if(btn.orientationValue == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.percentTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.percentTickFormat);
			}
		} else {
			if(btn.orientationValue == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.productionTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.productionTickFormat);
			}
		}
		
		me.stackedBarChart.draw();
	},
	
	/**
 	 * @function
 	 * @description Changing up the data source
 	 */
 	dataSourceHandler: function() {
	 	var me = this;
	 	
	 	me.graphData = me.rawData[me.currentDataSource].data;
	 	me.stackedBarChart.setChartTitle(me.dataHelpers[me.currentDataSource].title);
	 	me.metricHandler(me.currentMetric, null);
	 	
	 	return;
	}
});