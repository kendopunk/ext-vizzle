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
		
		// layout vars
		me.gridPanelHeight = 225,
			me.vizPanelWidth = Math.floor(Ext.getBody().getViewSize().width),
			me.vizPanelHeight = parseInt(
				(Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- me.gridPanelHeight
					- 15)
			),
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.gridHighlightEvent = 'igGridHighlight',
			me.playerData = [];
			
		// control vars
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
 			me.eventRelay = Ext.create('App.util.MessageBus');
 			
 		// pub/sub
		me.eventRelay.subscribe(me.gridHighlightEvent, me.gridRowHighlight, me);
 			
 		// color scheme menu options
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
				//resize: me.resizeHandler,
				scope: me
			}
		});
		
		// grid panel (center)
		me.gridPanel = Ext.create('Ext.grid.Panel', {
			region: 'center',
			title: 'Tabular Data',
			store: me.store,
			cls: 'gridRowSelection',
			columns: [
				/*
				App.util.ColumnDefinitions.movieTitle,
 				App.util.ColumnDefinitions.grossBO,
 				App.util.ColumnDefinitions.numTheaters,
 				App.util.ColumnDefinitions.openingBO,
 				App.util.ColumnDefinitions.releaseDate,
 				App.util.ColumnDefinitions.imdbRating
 				*/
			]
		});
		
		me.items = [
			me.vizPanel,
			me.gridPanel
		];
		
		me.on('beforerender', me.initPlayerData, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 */
 	initPlayerData: function() {
	 	var me = this;
	 	
	 	Ext.Ajax.request({
		 	url: 'data/daa/players.json',
		 	method: 'GET',
			success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.playerData = resp.players;
	 			
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
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
	 		me.canvasWidth = Math.floor(panel.body.dom.offsetWidth * .95),
	 		me.canvasHeight = Math.floor(panel.body.dom.offsetHeight * .95),
 			me.panelId = '#' + panel.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// bar chart shell
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
				}
			},
			//chartTitle: me.buildChartTitle(me.defaultMetricText),
			chartTitle: 'foo',
			yTickFormat: App.util.Global.svg.numberTickFormat,
			chartFlex: 4,
			legendFlex: 1,
			legendTextFunction: function(d, i) {
				return d.name;
			}
		}, me);
		
		/*	// get the data
	 	Ext.Ajax.request({
		 	url: 'data/ww2_battle_losses.json',
			method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.graphData = resp.data;
	 			
	 			var combinedData = me.dataCombiner(me.graphData);
	 			
	 			me.barChart = Ext.create('App.util.d3.UniversalBar', {
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
					maxBarWidth: Math.floor(me.canvasWidth * .4),
					eventRelay: me.eventRelay
				}, me);
				
				
				me.barChart.initChart().draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});*/
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
		if(btn.metric == 'theaters') {
			me.barChart.setYTickFormat(App.util.Global.svg.numberTickFormat);
		} else if(btn.metric == 'imdbRating') {
			me.barChart.setYTickFormat(function(d) {
				return Ext.util.Format.number(d, '0.0');
			});
		} else {
			me.barChart.setYTickFormat(App.util.Global.svg.wholeDollarTickFormat);
		}
		me.barChart.setChartTitle(me.buildChartTitle(btn.text));
		me.barChart.setDataMetric(btn.metric);
		me.barChart.draw();
	},
	
	/** 
	 * @function
	 * @private
	 * @description Set a new chart title
	 */
	buildChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append;
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
		
		var record = me.gridPanel.getStore().findRecord('title', obj.payload.title);
		if(record) {
			var rowIndex = me.gridPanel.getStore().indexOf(record);
			me.gridPanel.getSelectionModel().select(rowIndex);
		}
	}
});