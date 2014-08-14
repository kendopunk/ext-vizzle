/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.Conditioning', {
	extend: 'Ext.Panel',
	alias: 'widget.daaConditioning',
	title: 'Conditioning',
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
 			me.currentMetric = 'cones',
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
				{name: 'cones', type: 'auto'},
				{name: 'avgCones', type: 'auto'},
				{name: 'ladders', type: 'auto'},
				{name: 'avgLadders', type: 'auto'},
				{name: 'ws', type: 'auto'},
				{name: 'avgWs', type: 'auto'},
				{name: 'pushups', type: 'auto'},
				{name: 'avgPushups', type: 'auto'},
				{name: 'situps', type: 'auto'},
				{name: 'avgSitups', type: 'auto'},
				{name: 'run', type: 'auto'},
				{name: 'avgRun', type: 'auto'}
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
					text: '<span style="color:#990066;font-weight:bold;">Cones:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					cls: me.btnHighlightCss,
					metric: 'cones',
					metricFormat: 'decimal',
					metricLabel: 'Cones',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgCones',
					metricFormat: 'decimal',
					metricLabel: 'Cones Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Ladders:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'ladders',
					metricFormat: 'decimal',
					metricLabel: 'Ladders',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgLadders',
					metricFormat: 'decimal',
					metricLabel: 'Ladders Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">W Drill:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'ws',
					metricFormat: 'decimal',
					metricLabel: 'W Drill',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgWs',
					metricFormat: 'decimal',
					metricLabel: 'W Drill Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Pushups:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'pushups',
					metricFormat: 'number',
					metricLabel: 'Pushups',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgPushups',
					metricFormat: 'number',
					metricLabel: 'Pushups Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Situps:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'situps',
					metricFormat: 'number',
					metricLabel: 'Situps',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgSitups',
					metricFormat: 'number',
					metricLabel: 'Situps Average',
					handler: me.metricHandler,
					scope: me
				}, 
				{
					xtype: 'tbspacer', width: 12
				},
				{
					xtype: 'tbtext',
					text: '<span style="color:#990066;font-weight:bold;">Run:</span>'
				}, {
					xtype: 'button',
					text: 'Best',
					metric: 'run',
					metricFormat: 'runtime',
					metricLabel: 'Run',
					handler: me.metricHandler,
					scope: me
				}, 
				'-',
				{
					xtype: 'button',
					text: 'Avg',
					metric: 'avgRun',
					metricFormat: 'runtime',
					metricLabel: 'Run Average',
					handler: me.metricHandler,
					scope: me
				}]
			}]
		});

		me.gridPanel = Ext.create('Ext.grid.Panel', {
			region: 'center',
			title: 'Conditioning Data Table',
			store: me.store,
			cls: 'gridRowSelection',
			columns: [{
				header: 'Player',
				dataIndex: 'name',
				flex: 1
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Cones</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'cones',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgCones',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Ladders</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'ladders',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgLadders',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">W Drill</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'ws',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgWs',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.00') + ' sec';
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Pushups</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'pushups',
					sortable: true,
					flex: 1
				}, {
					header: 'Avg',
					dataIndex: 'avgPushups',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.0');
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Situps</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'situps',
					sortable: true,
					flex: 1
				}, {
					header: 'Avg',
					dataIndex: 'avgSitups',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return Ext.util.Format.number(v, '0.0');
					}
				}]
			}, {
				text: '<span style="color:#990066; font-weight:bold;">Run</span>',
				columns: [{
					header: 'Best',
					dataIndex: 'run',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return App.util.Global.svg.secondsToRunTime(v);
					}
				}, {
					header: 'Avg',
					dataIndex: 'avgRun',
					sortable: true,
					flex: 1,
					renderer: function(v) {
						return App.util.Global.svg.secondsToRunTime(v);
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
			dataMetric: 'cones',
			chartTitle: me.baseTitle + ' - Cones',
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
					+ Ext.util.Format.number(d.cones, '0.00')
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
				cones: Ext.Array.min(player.conditioning.cones),
				avgCones: Ext.Array.mean(player.conditioning.cones),
				ladders: Ext.Array.min(player.conditioning.ladders),
				avgLadders: Ext.Array.mean(player.conditioning.ladders),
				ws: Ext.Array.min(player.conditioning.ws),
				avgWs: Ext.Array.mean(player.conditioning.ws),
				pushups: Ext.Array.max(player.conditioning.pushups),
				avgPushups: Ext.Array.mean(player.conditioning.pushups),
				situps: Ext.Array.max(player.conditioning.situps),
				avgSitups: Ext.Array.mean(player.conditioning.situps),
				run: Ext.Array.min(player.conditioning.run),
				avgRun: Ext.Array.mean(player.conditioning.run)
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
		
		if(btn.metricFormat == 'runtime') {
		
			me.barChart.setTooltipFunction(function(d, i) {
				return '<b>' + d.name + '</b><br>'
					+ App.util.Global.svg.secondsToRunTime(d[btn.metric]);
			});
			
			me.barChart.setYTickFormat(function(d, i) {
				return App.util.Global.svg.secondsToRunTime(d);
			});
		
		} else if(btn.metricFormat == 'number') {
			
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