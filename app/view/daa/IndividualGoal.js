/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.IndividualGoal', {
	extend: 'Ext.Panel',
	alias: 'widget.daaIndividualGoal',
	title: 'Individual Goals/Assists',
	closable: false,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalBar',
		'App.util.d3.UniversalPie'
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
			me.gridHighlightEvent = 'igGridHighlight',
			me.gridUnhighlightEvent = 'igGridUnhighlight',
			me.playerData = [];
		
		////////////////////////////////////////
		// control vars
		////////////////////////////////////////
		me.svgInitialized = false,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.barChart = null,
 			me.pieChart = null,
 			me.defaultMetric = 'goals',
 			me.currentMetric = 'goals',
 			me.btnHighlightCss = 'btn-highlight-peachpuff',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.baseTitle = 'Fall 2014';

 		var colorSchemeMenu = Ext.Array.map(App.util.Global.svg.colorSchemes, function(obj) {
	 		return {
		 		text: obj.name,
		 		handler: function(btn) {
			 		//btn.setIconCls('icon-tick');
			 		//me.barChart.setColorPalette(obj.palette);
			 		//me.barChart.draw();
			 	},
			 	scope: me
			}
		}, me);
		
		me.store = Ext.create('Ext.data.Store', {
			fields: [
				{name: 'player', type: 'string'},
				{name: 'goals', type: 'auto'},
				{name: 'assists', type: 'auto'}
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
				items: [{
					xtype: 'tbspacer',
					width: 10
				}, {
					xtype: 'button',
					iconCls: 'icon-soccer-ball',
					text: 'Goals',
					cls: me.btnHighlightCss,
					metric: 'goals',
					handler: me.metricHandler,
					scope: me
				},
				'-',
				{
					xtype: 'button',
					iconCls: 'icon-soccer-assist',
					text: 'Assists',
					metric: 'assists',
					handler: me.metricHandler,
					scope: me
				}]
			}]
		});

		me.gridPanel = Ext.create('Ext.grid.Panel', {
			region: 'center',
			title: 'Tabular Data',
			store: me.store,
			cls: 'gridRowSelection',
			columns: [{
				header: 'Player',
				dataIndex: 'name',
				width: 150
			}, {
				header: 'Goals',
				dataIndex: 'goals',
				width: 100
			}, {
				header: 'Assists',
				dataIndex: 'assists',
				width: 100
			}]
		});
		
		me.items = [
			me.vizPanel,
			me.gridPanel
		];
		
		me.on('beforerender', me.initPlayerData, me);
		
		me.eventRelay.subscribe(me.gridHighlightEvent, me.gridRowHighlight, me);
		me.eventRelay.subscribe(me.gridUnhighlightEvent, me.gridRowUnhighlight, me);

		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @description Initialize the entire array of players
 	 */
 	initPlayerData: function() {
	 	var me = this;
	 	
	 	Ext.Ajax.request({
		 	url: 'data/daa/players.json',
		 	method: 'GET',
			success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.playerData = resp.F14;
	 			
	 			Ext.each(me.playerData, function(item) {
		 			item.goals = 0;
		 			item.assists = 0;
		 		}, me);
		 	},
		 	scope: me
		 });
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
			dataMetric: me.defaultMetric,
			graphData: [],
			panelId: me.panelId,
			showLabels: true,
			orientation: 'horizontal',
			labelFunction: function(data, index) {
				return data.name;
			},
			margins: {
				top: 20,
				right: 10,
				bottom: 10,
				left: 110,
				leftAxis: 90
			},
			tooltipFunction: function(data, index) {
				return '<b>' + data.name + '</b><br>'
					+ 'Goals: ' + data.goals + '<br>'
					+ 'Assists: ' + data.assists;
			},
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
			},
			chartTitle: me.buildChartTitle(),
			yTickFormat: App.util.Global.svg.numberTickFormat,
			chartFlex: 4,
			legendFlex: 1,
			legendTextFunction: function(d, i) {
				return d.name;
			},
			colorDefinedInData: true
		}, me);
		
		// get data
		Ext.Ajax.request({
			url: 'data/daa/gamedata.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				me.graphData = me.normalizeData(resp.data);
				
				me.store.loadData(me.graphData);
				
				me.barChart.setGraphData(me.sortData(me.graphData));
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
	 		playerName = null;
	 	
	 	var dat = Ext.clone(me.playerData);
	 	
	 	Ext.each(dat, function(player) {
	 	
	 		playerName = player.name;
	 		
	 		Ext.each(obj, function(a) {
	 		
	 			Ext.each(a.goalData, function(gd) {
	 				if(gd.name == playerName) {
		 				player.goals += gd.num;
		 			}
	 			});
	 			
	 			Ext.each(a.assistData, function(ad) {
	 				if(ad.name == playerName) {
		 				player.assists += ad.num;
		 			}
	 			});

	 		});
	 	});
	 	
	 	return dat;
 	},
 	
 	/**
	 * @function
	 * @description Sort graph data before consumption
	 */
	sortData: function(d) {
		var me = this;
		
		var sortProp = 'name';
		
		return Ext.Array.sort(d, function(a, b) {
			if(a[sortProp] > b[sortProp]) {
				return 1;
			} else if (a[sortProp] < b[sortProp]) {
				return -1;
			} else {
				return 0;
			}
		});
	},
	
	/**
	 * @function
	 * @memberOf App.view.daa.VizPanel
	 * @description Toolbar button handler
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
		// button cls
		Ext.each(me.vizPanel.query('toolbar > button'), function(button) {
			if(btn.hasOwnProperty('metric')) {
				if(button.metric == btn.metric) {
					button.addCls(me.btnHighlightCss);
				} else {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
		me.currentMetric = btn.metric;
		me.barChart.setChartTitle(me.buildChartTitle());
		me.barChart.setDataMetric(btn.metric);
		me.barChart.draw();
	},
	
	/** 
	 * @function
	 * @private
	 * @description Set a new chart title
	 */
	buildChartTitle: function() {
		var me = this;
		
		if(me.currentMetric == 'assists') {
			return me.baseTitle  + ' - Individual Assists';
		}
		return me.baseTitle + ' - Individual Goals';
	},
	
	/**
	 * @function
	 */
	resizeHandler: function(panel, w, h) {
		var me = this;
		
		//me.canvasWidth = Math.floor(panel.body.dom.offsetWidth),
		//me.canvasHeight = Math.floor(panel.body.dom.offsetHeight);
	 	
	 	//if(me.barChart != null && me.barChart.chartInitialized) {
			//me.barChart.resize(me.canvasWidth, me.canvasHeight);
		//}
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.daa.IndividualGoal
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