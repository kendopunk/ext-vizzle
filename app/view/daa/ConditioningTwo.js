/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.ConditioningTwo', {
	extend: 'Ext.Panel',
	alias: 'widget.daaConditioningTwo',
	title: 'Conditioning II',
	closable: false,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalBar'
	],
	
	layout: 'border',
	defaults: {
		split: true
	},
	
	initComponent: function() {
		var me = this;
		
		////////////////////////////////////////
		// layout vars
		////////////////////////////////////////
		me.gridPanelHeight = 250,
			me.vizPanelWidth = Math.floor(Ext.getBody().getViewSize().width),
			me.vizPanelHeight = parseInt(
				(Ext.getBody().getViewSize().height 
					- App.util.Global.daaPanelHeight
					- me.gridPanelHeight
					- 15)
			),
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.gridHighlightEvent = 'conGridHighlight',
			me.gridUnhighlightEvent = 'conGridUnhighlight',
			me.playerData = [];
		
		////////////////////////////////////////
		// control vars
		////////////////////////////////////////
		me.svgInitialized = false,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.graphData = [],
 			me.svg,
 			me.g,
 			me.panelId,
 			me.barChart = null,
 			me.currentMetric = 'fiveTenTens',
 			me.btnHighlightCss = 'btn-highlight-peachpuff',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.baseTitle = '2014 Conditioning Results';
 			
 		////////////////////////////////////////
 		// eventing
 		////////////////////////////////////////
 		me.eventRelay.subscribe(me.gridHighlightEvent, me.gridRowHighlight, me);
 		me.eventRelay.subscribe(me.gridUnhighlightEvent, me.gridRowUnhighlight, me);
	 	
	 	////////////////////////////////////////
	 	// grid store
	 	////////////////////////////////////////
		me.store = Ext.create('Ext.data.Store', {
			fields: [
				{name: 'player', type: 'string'},
				{name: 'fiveTenTens', type: 'auto'},
				{name: 'avgFiveTenTens', type: 'auto'},
				{name: 'quickHops', type: 'auto'},
				{name: 'avgQuickHops', type: 'auto'},
				{name: 'figureEights', type: 'auto'},
				{name: 'avgFigureEights', type: 'auto'}
			],
			proxy: {
				type: 'memory'
			}
		});
		
		me.vizPanel = Ext.create('Ext.Panel', {
			region: 'north',
			collapsible: true,
			collapsed: false,
			hideCollapseTool: true,
			width: me.vizPanelWidth,
			height: me.vizPanelHeight,
			layout: 'fit',
			autoScroll: true,
			listeners: {
				afterrender: me.initCanvas,
				scope: me
			},
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">5-10-10s:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					cls: me.btnHighlightCss,
					metric: 'fiveTenTens',
					metricFormat: 'decimal',
					metricLabel: '5-10-10s',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgFiveTenTens',
					metricFormat: 'decimal',
					metricLabel: '5-10-10 Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Quick Hops:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'quickHops',
					metricFormat: 'decimal',
					metricLabel: 'Quick Hops',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgQuickHops',
					metricFormat: 'decimal',
					metricLabel: 'Quick Hops Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Figure 8s:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'figureEights',
					metricFormat: 'decimal',
					metricLabel: 'Figure 8s',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgFigureEights',
					metricFormat: 'decimal',
					metricLabel: 'Figure 8 Average',
					handler: me.metricHandler,
					scope: me
				}]
			}]
		});

		me.gridPanel = Ext.create('Ext.grid.Panel', {
			region: 'center',
			title: 'Conditioning II Data Table',
			store: me.store,
			cls: 'gridRowSelection',
			columns: [{
				header: 'Player',
				dataIndex: 'name',
			}, {
				text: '<span style="color:#990066; font-weight:bold;">5-10-10s</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'fiveTenTens',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgFiveTenTens',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Quick Hops</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'quickHops',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgQuickHops',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Figure 8s</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'figureEights',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgFigureEights',
					sortable: true,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}]
		});
		
		me.items = [ me.vizPanel, me.gridPanel ];

		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @description Initialize drawing canvas
	 */
	initCanvas: function(panel) {
		var me = this;
		
		me.getEl().mask('Loading...');
		
 		me.svgInitialized = true,
	 		me.canvasWidth = Math.floor(panel.body.dom.offsetWidth * .95),
	 		me.canvasHeight = Math.floor(panel.body.dom.offsetHeight * .95),
 			me.panelId = '#' + panel.body.id;
	 	
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	me.barChart = Ext.create('App.util.d3.UniversalBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			dataMetric: 'fiveTenTens',
			chartTitle: me.baseTitle + ' - 5-10-10s',
			colorDefinedInData: true,
			showLabels: true,
			labelFunction: function(d, i) {
				return d.name;
			},
			margins: {
				top: 30,
				right: 10,
				bottom: 10,
				left: 80,
				leftAxis: 70
			},
			tooltipFunction: function(d, i) {
				return '<b>' + d.name + '</b><br>'
					+ Ext.util.Format.number(d.fiveTenTens, '0.00')
					+ ' seconds';
			},
			yTickFormat: function(d, i) {
				return Ext.util.Format.number(d, '0.00') + ' sec';
			},
			showLegend: false,
			handleEvents: true,
			mouseEvents: {
				mouseover: {
					enabled: true,
					eventName: me.gridHighlightEvent
				},
				mouseout: {
					enabled: true,
					eventName: me.gridUnhighlightEvent
				}
			}
		});
		
		// get data
		Ext.Ajax.request({
			url: 'data/daa/players.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				
				me.graphData = me.normalizeData(resp.F14);
				
				me.store.loadData(me.graphData);
				
				me.barChart.setGraphData(me.graphData);
				me.barChart.initChart().draw();
			},
			callback: function() {
				me.getEl().unmask();
			},
			scope: me
		});
	},
	
	/**
	 * @function
	 * @description Normalize JSON data into chart-consumable
	 * format
	 */
 	normalizeData: function(obj) {
	 	var me = this,
		 	ret = [];
		 	
		Ext.each(obj, function(player) {
		
			ret.push({
				name: player.name,
				color: player.color,
				fiveTenTens: Ext.Array.min(player.conditioning.fiveTenTens),
				avgFiveTenTens: Ext.Array.mean(player.conditioning.fiveTenTens),
				quickHops: Ext.Array.min(player.conditioning.quickHops),
				avgQuickHops: Ext.Array.mean(player.conditioning.quickHops),
				figureEights: Ext.Array.min(player.conditioning.figureEights),
				avgFigureEights: Ext.Array.mean(player.conditioning.figureEights)
			});

		});
	 	
		return ret;
 	},
 	
 	buildChartTitle: function(append) {
 		var me = this;
 		
 		return me.baseTitle + ' - ' + append;
 	},
 	
 	metricHandler: function(btn, evt) {
		var me = this;
		
		// button cls
		Ext.each(me.query('toolbar > button'), function(button) {
			if(btn.hasOwnProperty('metric')) {
				if(button.metric == btn.metric) {
					button.addCls(me.btnHighlightCss);
				} else {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
		me.currentMetric = btn.metric;
		
		if(btn.metricFormat == 'number') {
			
			me.barChart.setTooltipFunction(function(d, i) {
				return '<b>' + d.name + '</b><br>'
					+ Ext.util.Format.number(d[btn.metric]);
			});
			
			me.barChart.setYTickFormat(function(d, i) {
				return Ext.util.Format.number(d);
			});
		
		
		} else {
		
			me.barChart.setTooltipFunction(function(d, i) {
				return '<b>' + d.name + '</b><br>'
					+ Ext.util.Format.number(d[btn.metric], '0.00') + ' seconds';
			});
			
			me.barChart.setYTickFormat(function(d, i) {
				return Ext.util.Format.number(d, '0.00') + ' sec';
			});
		}
		
		me.barChart.setChartTitle(me.buildChartTitle(btn.metricLabel));
		me.barChart.setDataMetric(btn.metric);
		me.barChart.draw();
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.daa.Conditioning
 	 * @param obj Generic obj {title: ''}
 	 * @description Attempt to highlight a grid row based on a movie title value
 	 */
	gridRowHighlight: function(obj) {
		var me = this;
		
		var record = me.gridPanel.getStore().findRecord('name', obj.payload.name);
		if(record) {
			var rowIndex = me.gridPanel.getStore().indexOf(record);
			me.gridPanel.getSelectionModel().select(rowIndex);
		}
	},
	
	/**
 	 * @function
 	 */
	gridRowUnhighlight: function() {
		var me = this;
		
		me.gridPanel.getSelectionModel().deselectAll();
	}
});