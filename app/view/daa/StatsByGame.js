/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.StatsByGame', {
	extend: 'Ext.Panel',
	alias: 'widget.daaStatsByGame',
	title: 'Stats By Game',
	closable: false,
	
	requires: [
		'App.store.daa.SeasonMetaStore',
		'App.store.daa.Players'
	],
	
	initComponent: function() {
		var me = this;
		
		me.gameData = [],
			me.seasonId = null,
			me.seasonName = null,
			me.gameData = [],
			me.gameId = null,
			me.currentOpponent = '',
			me.goalChart = null,
			me.assistChart = null,
			me.shotChart = null,
			me.saveChart = null,
			me.shotsAgainstChart = null,
			me.shotsScoredChart = null,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.width = Math.floor(Ext.getBody().getViewSize().width),
			me.height = Math.floor(Ext.getBody().getViewSize().height) - App.util.Global.daaPanelHeight;

		////////////////////////////////////////
		// toolbar components
		////////////////////////////////////////
		me.seasonCombo = Ext.create('Ext.form.field.ComboBox', {
			store: Ext.create('App.store.daa.SeasonMetaStore', {
				url: 'data/daa/seasonListMeta.json'
			}),
			displayField: 'seasonName',
			valueField: 'seasonId',
			editable: false,
			queryMode: 'local',
			triggerAction: 'all',
			width: 150,
			listWidth: 150,
			listeners: {
				select: function(combo, record) {
					me.seasonId = combo.getValue();
					me.setGameCombo(false);
				},
				scope: me
			}
		});
		
		me.gameCombo = Ext.create('Ext.form.field.ComboBox', {
			disabled: true,
			store: Ext.create('Ext.data.Store', {
				fields: ['id', 'opponent'],
				data: []
			}),
			displayField: 'opponent',
			valueField: 'id',
			queryMode: 'local',
			triggerAction: 'all',
			width: 175,
			listWidth: 175,
			listeners: {
				select: function(combo) {
					me.gameId = combo.getValue();
					me.buildChart();
				},
				scope: me
			}
		});
		
		me.scoreTextItem = Ext.create('Ext.toolbar.TextItem', {
			text: ''
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbtext', text: '<b>Season:</b>'},
				me.seasonCombo,
				{xtype: 'tbspacer', width: 10},
				{xtype: 'tbtext', text: '<b>Game:</b>'},
				me.gameCombo,
				{xtype: 'tbspacer', width: 10},
				me.scoreTextItem,
				'->',
				{xtype: 'tbtext', text: '* = scrimmage'},
				{xtype: 'tbspacer', width: 20}
			]
		}];
		
		me.on('afterrender', me.initSeason, me);
		
		me.callParent(arguments);
	},
	
	/**
  	 * @function
  	 * @description Load the season selection store then initialize the canvas
  	 */
 	initSeason: function(panel) {
	 	var me = this;
	 	
	 	me.seasonCombo.getStore().load({
		 	callback: function(records) {
		 		me.seasonId = records[0].data.seasonId;
		 		me.seasonName = records[0].data.seasonName;
			 	me.seasonCombo.setValue(records[0].data.seasonId);
			 	
			 	me.setGameCombo(true);
		 	},
		 	scope: me
		});
	},
	
	/**
 	 * @function
 	 * @description Set up the game selection combo
 	 * @param initial Boolean...initial setting
 	 */
 	setGameCombo: function(initial) {
 		var me = this;
 		
 		Ext.Ajax.request({
	 		url: 'data/daa/game' + me.seasonId + '.json',
	 		method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				me.gameData = resp;
			},
			callback: function() {
				var comboData = [];
				Ext.each(me.gameData, function(gd) {
					var opp = gd.opponent + ' - ' + gd.gameDate;
					if(gd.scrimmage) {
						opp = opp + ' *';
					}
					
					comboData.push({
						id: gd.gameId,
						opponent: opp
					});
				});
				
				me.gameCombo.setDisabled(false);
				me.gameCombo.getStore().loadData(comboData);
				me.gameCombo.setValue(comboData[0].id);
				me.gameId = comboData[0].id;
				me.gameCombo.enable();
				
				if(initial) {
					me.initCanvas();
				} else {
					me.buildChart();
				}
			},
			scope: me
		});	
	},
	
	initCanvas: function(panel) {
		var me = this;
		
		// initialize SVG, width, height
		me.offsetWidth = Math.floor(me.body.dom.offsetWidth * .95),
			me.offsetHeight = Math.floor(me.body.dom.offsetHeight),
			me.panelId = '#' + me.body.id;
		
		// primary SVG component
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.offsetWidth)
	 		.attr('height', me.offsetHeight);
	 		
		var oneWidthUnit = me.offsetWidth / 3,
			oneHeightUnit = me.offsetHeight / 2,
			theLabelFunction = function(d) {
				return d.data.name + ' (' + d.data.num + ')';
			},
			theTooltipFunction = function(d) {
				return '<b>' + d.data.name + '</b><br>' + d.data.num;
			};
	 		
	 	//////////////////////////////
	 	// GOALS
	 	//////////////////////////////
	 	me.goalChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'default',
			margins: {
				top: 30
			},
			chartTitle: 'Goals',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
		
		//////////////////////////////
	 	// ASSISTS
	 	//////////////////////////////
	 	me.assistChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g').attr('transform', 'translate(' + oneWidthUnit + ',0)'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'default',
			margins: {
				top: 30
			},
			chartTitle: 'Assists',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
		
		//////////////////////////////
	 	// SHOTS
	 	//////////////////////////////
	 	me.shotChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g').attr('transform', 'translate(' + (oneWidthUnit * 2) + ',0)'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'default',
			margins: {
				top: 30
			},
			chartTitle: 'Shots On Goal',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
		
	 	//////////////////////////////
	 	// saves
	 	//////////////////////////////
	 	me.saveChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g').attr('transform', 'translate(0,' + oneHeightUnit + ')'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'gradient_red',
			margins: {
				top: 30
			},
			chartTitle: 'Saves',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
	 	
	 	//////////////////////////////
	 	// shots against
	 	//////////////////////////////
	 	me.shotsAgainstChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g').attr('transform', 'translate(' + oneWidthUnit + ',' + oneHeightUnit + ')'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'gradient_red',
			margins: {
				top: 30
			},
			chartTitle: 'Shots Against',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
		
		//////////////////////////////
	 	// shots scored
	 	//////////////////////////////
	 	me.shotsScoredChart = Ext.create('App.util.d3.UniversalPie', {
		 	svg: me.svg.append('svg:g').attr('transform', 'translate(' + (oneWidthUnit * 2) + ',' + oneHeightUnit + ')'),
		 	canvasWidth: me.offsetWidth/3,
		 	canvasHeight: me.offsetHeight/2,
			colorPalette: 'gradient_red',
			margins: {
				top: 30
			},
			chartTitle: 'Shots Scored Against',
			dataMetric: 'num',
			showLabels: true,
			labelFunction: theLabelFunction,
			tooltipFunction: theTooltipFunction
		});
		
		me.buildChart();
	},
	
	/**
 	 * @function
 	 * @description Normalize data and build the charts
 	 */
	buildChart: function() {
		var me = this,
			proceed = false;
		
		var goalData = [], assistData = [], shotData = [],
			saveData = [], shotsAgainstData = [], shotsScoreData = [];
			
		Ext.each(me.gameData, function(gd) {
			if(gd.gameId == me.gameId) {
				
				me.scoreTextItem.setText('<b>' + gd.scoreString + '</b>');
			
				me.goalChart.setGraphData(Ext.Array.sort(gd.goalData, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
			
				me.assistChart.setGraphData(Ext.Array.sort(gd.assistData, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
				
				me.shotChart.setGraphData(Ext.Array.sort(gd.shotData, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
				
				me.saveChart.setGraphData(Ext.Array.sort(gd.saveData, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
				
				me.shotsAgainstChart.setGraphData(Ext.Array.sort(gd.shotsAgainst, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
				
				me.shotsScoredChart.setGraphData(Ext.Array.sort(gd.shotsScored, function(a, b) {
					if(a.num > b.num) { return -1; }
					else if(a.num < b.num) { return 1; }
					return 0
				}));
				
				proceed = true;
			}
		}, me);

		if(proceed) {
			if(!me.goalChart.chartInitialized) {
				me.goalChart.initChart().draw();
				me.assistChart.initChart().draw();
				me.shotChart.initChart().draw();
				me.saveChart.initChart().draw();
				me.shotsAgainstChart.initChart().draw();
				me.shotsScoredChart.initChart().draw();
			} else {
				me.goalChart.draw();
				me.assistChart.draw();
				me.shotChart.draw();
				me.saveChart.draw();
				me.shotsAgainstChart.draw();
				me.shotsScoredChart.draw();
			}
		}
	}
});