/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barlegend
 * @description Bar chart with legend
 */
Ext.define('App.view.d3.battle.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.battleMainPanel',
	title: 'Mouse Events',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.BarChart'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.barChart = null,
 			me.baseTitle = 'WW2 Battle Casualties',
 			me.defaultMetric = 'casualties',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.drilldownLevel = 1;
 			
 		me.eventRelay.subscribe('battleDrilldown', me.drillUpDown, me);

		me.chartDescription = '<b>Mouse Events</b><br><br>'
			+ '<i>Casualties from selected WW2 battles</i><br><br>'
			+ 'Double click a bar to drill down to Axis/Allied casualty breakdown for that battle.';
			
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		// after render, initialize the canvas
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.barlegend.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
	 	var me = this;
	 	
	 	me.getEl().mask('Drawing...');
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// get the data
	 	Ext.Ajax.request({
		 	url: 'data/ww2_battle_losses.json',
			method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.graphData = resp.data;
	 			
	 			var combinedData = me.dataCombiner(me.graphData);
	 			
	 			me.barChart = Ext.create('App.util.d3.final.BarChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					graphData: combinedData,
					dataMetric: me.defaultMetric,
					panelId: me.panelId,
					margins: {
						top: 20,
						right: 10,
						bottom: 40,
						left: 100,
						leftAxis: 85
					},
					showLabels: true,
					labelFunction: function(data, index) {
						return data.battle
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.battle + '</b><br>'
							+ Ext.util.Format.number(data.casualties, '0,000');
					},
					yTickFormat: App.util.Global.svg.numberTickFormat,
					chartTitle: me.baseTitle,
					colorDefinedInData: true,
					mouseEvents: {
						mouseover: {enabled: false, eventName: null},
						click: {enabled: false, eventName: null},
						dblclick: {
							enabled: true,
							eventName: 'battleDrilldown'
						}
					},
					eventRelay: me.eventRelay
				}, me);
				
				
				me.barChart.draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	},
	
	dataCombiner: function(data) {
		var ret = [];
		
		Ext.each(data, function(d) {
			ret.push({
				battle: d.battle,
				color: d.color,
				casualties: d.casualties.axis + d.casualties.allied
			});
		});
		
		return ret;
	},
	
	/**
	 * msg.payload
	 * msg.index
	 */
	drillUpDown: function(msg) {
		var me = this;
		
		if(me.drilldownLevel == 1) {
			
			var ddData = [];
			Ext.each(me.graphData, function(d) {
				if(d.battle == msg.battle) {
					ddData.push({
						battle: 'Axis',
						color: '#FF0000',
						casualties: d.casualties.axis
					}, {
						battle: 'Allied',
						color: '#0000FF',
						casualties: d.casualties.allied
					});
				}
			});
		
			me.drilldownLevel = 2;
			me.barChart.setGraphData(ddData);
			me.barChart.setChartTitle(me.baseTitle + ' - ' + msg.battle);
			me.barChart.transition();
		
		} else {
			me.drilldownLevel = 1;
			me.barChart.setGraphData(me.dataCombiner(me.graphData));
			me.barChart.setChartTitle(me.baseTitle);
			me.barChart.transition();
		}
	}
});
