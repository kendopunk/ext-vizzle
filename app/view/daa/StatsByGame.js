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
		'App.store.daa.Players'
	],
	
	initComponent: function() {
		var me = this;
		
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

		// game selector
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
			items: [{
				xtype: 'tbtext',
				text: '<b>Select Game:</b>'
			},
				me.gameCombo,
			{
				xtype: 'tbspacer',
				width: 15
			}, {
				xtype: 'tbtext',
				text: '* = scrimmage'
			}, {
				xtype: 'tbspacer',
				width: 20
			},
			me.scoreTextItem
			]
		}];
		
		me.on('afterrender', me.initData, me);
		
		me.callParent(arguments);
	},
	
	initData: function(panel) {
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
			chartTitle: 'Shots Taken Against',
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
		
		// get game data
		Ext.Ajax.request({
			url: 'data/daa/gamedata.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				me.gameData = resp.data;
			},
			callback: function() {
				var comboData = [];
				Ext.each(me.gameData, function(g) {
					var opp = g.opponent + ' - ' + g.date;
					if(g.scrimmage) {
						opp = opp + ' *';
					}
					
					comboData.push({
						id: g.id,
						opponent: opp
					});
				});
				
				me.gameCombo.getStore().loadData(comboData);
				me.gameCombo.enable();
			},
			scope: me
		});
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
			if(gd.id == me.gameId) {
				
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