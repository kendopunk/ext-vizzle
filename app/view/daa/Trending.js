/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.Trending', {
	extend: 'Ext.Panel',
	alias: 'widget.daaTrending',
	title: 'Individual Trends',
	closable: false,
	
	requires: [
		'App.store.daa.Players',
		'App.store.daa.SeasonMetaStore',
		'App.util.d3.UniversalLine'
	],
	
	initComponent: function() {
		var me = this;
		
		me.svgInitialized = false,
			me.graphData = [],
			me.playerData = [],
			me.canvasHeight,
			me.canvasWidth,
			me.svg,
			me.panelId,
			me.lineChart = null,
			me.btnHighlightCss = 'btn-highlight-peachpuff';
			me.width = Math.floor(Ext.getBody().getViewSize().width),
			me.height = Math.floor(Ext.getBody().getViewSize().height) - App.util.Global.daaPanelHeight,
			me.currentYDataMetric = 'goals',
			me.currentPlayerSelection = null,
			me.baseTitle = 'Fall 2014 Trending';
			
		////////////////////////////////////////
 		// TOOLBAR COMPONENTS
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
					me.seasonName = record[0].data.seasonName;

					me.getPlayers();
				},
				scope: me
			}
		});
		
		me.playerCombo = Ext.create('Ext.form.field.ComboBox', {
			disabled: true,
			store: Ext.create('Ext.data.Store', {
				fields: ['display', 'value'],
				data: []
			}),
			displayField: 'display',
			valueField: 'value',
			editable: false,
			queryMode: 'local',
			triggerAction: 'all',
			width: 125,
			listWidth: 125,
			listeners: {
				select: function(combo) {
					me.currentPlayerSelection = combo.getValue();
					me.getData();
				},
				scope: me
			}
		});

		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbtext', text: '<b>Season:</b>'},
				me.seasonCombo,
				{xtype: 'tbspacer', width: 20},
				{xtype: 'tbtext', text: '<b>Player:</b>'},
				me.playerCombo,
				{xtype: 'tbspacer', width: 20},
				{
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
					iconCls: 'icon-target',
					text: 'Shots on Goal',
					metric: 'shots',
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
				},
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
			 	me.initCanvas();

		 		me.seasonId = records[0].data.seasonId;
		 		me.seasonName = records[0].data.seasonName;
			 	me.seasonCombo.setValue(records[0].data.seasonId);
			 	
			 	me.getPlayers();
			},
		 	scope: me
		});
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.area.GenericLine
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
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
	 		
	 	// init chart
	 	me.lineChart = Ext.create('App.util.d3.UniversalLine', {
		 	svg: me.svg,
		 	canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			panelId: me.panelId,
			margins: {
				top: 40,
				right: 70,
				bottom: 60,
				left: 70
			},
			fillArea: true,
			fillColor: '#FFE4B5',
			xScalePadding: .1,
			yScalePadding: .1,
			xDataMetric: 'game',
			xTickValues: true,
			yDataMetric: 'goals',
			chartTitle: me.buildChartTitle(),
			markerFillColor: '#FF9933',
			markerStrokeColor: '#CC3300',
			pathStroke: '#006400',
			pathStrokeWidth: 2,
			xTickFormat: function(d) {
				return 'Game ' + d;
			},
			yTickFormat: function(d) {
				return Ext.util.Format.number(d);
			},
			showLabels: true,
			labelFunction: function(d, i) {
				return d.opponent + ' (' + d.goals + ')';
			},
			tooltipFunction: function(d, i) {
				var ret = '<b>vs ' + d.opponent + '</b><br><br>';
				
				ret = ret + 'Date: ' + d.date + '<br>';
				
				ret = ret + 'Result: ';
				if(d.goalsFor > d.goalsAgainst) {
					ret = ret + 'WIN';
				} else if(d.goalsFor < d.goalsAgainst) {
					ret = ret + 'LOSS';
				} else {
					ret = ret + 'TIE';
				}
				ret = ret + '<br>';
				
				ret = ret + 'Goals For: ' + d.goalsFor + '<br>';
				ret = ret + 'Goals Against: ' + d.goalsAgainst;
				
				return ret;
			},
			markerRadius: 5
		});
	},
 	
	/**
 	 * @function
 	 * @description Initialize the entire array of players for selected season
 	 */
 	getPlayers: function() {
		var me = this;
	 	
	 	Ext.Ajax.request({
		 	url: 'data/daa/players' + me.seasonId + '.json',
		 	method: 'GET',
			success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.playerCombo.setDisabled(false);
	 			
		 		me.playerCombo.getStore().loadData(
		 			Ext.Array.merge([{display: 'ENTIRE TEAM', value: ''}], 
			 			Ext.Array.map(resp, function(item) {
				 			return {
					 			display: item.fname,
					 			value: item.fname
					 		};
				 		})
				 	)
		 		);
		 		
		 		if(me.currentPlayerSelection == null) {
			 		me.currentPlayerSelection = '';
			 		me.playerCombo.setValue('');
			 	}
	 		},
	 		callback: function() {
	 			me.getData();
	 		},
	 		scope: me
	 	});
	},
	 
	/**
	 * @function
	 * @description Retrieve initial data set
	 */
	getData: function() {
	 	var me = this,
	 		filter = false,
	 		player = null;

	 	if(me.currentPlayerSelection !== '') {
		 	filter = true;
		 	player = me.currentPlayerSelection;
		}
		 	
	 	me.getEl().mask('Loading...');

		Ext.Ajax.request({
			url: 'data/daa/game' + me.seasonId + '.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				me.graphData = me.normalizeData(resp, filter, player);
				
				me.lineChart.setGraphData(me.graphData);
				if(!me.lineChart.chartInitialized) {
					me.lineChart.initChart().draw();
				} else {
					me.lineChart.draw();
				}
			},
			callback: function() {
				me.getEl().unmask();
			},
			scope: me
		});
	},
	 
	/**
	 * @function
	 * @description Normalize data for consumption by line chart
	 * @param obj
	 * @param filter
	 * @param player
	 */
	 normalizeData: function(obj, filter, player) {
	 
		 var me = this,
			 game = 1,
			 ret = [], goals, assists, shots;
		 
		 Ext.each(obj, function(entry) {
			 goals = 0;
			 assists = 0;
			 shots = 0;
			 
			 Ext.each(entry.goalData, function(gd) {
				if(
					(filter && player && gd.name == player)
					||
					(!filter && player == null)
				 ) {
					goals += gd.num;
				}
			 });
			 
			 Ext.each(entry.assistData, function(ad) {
				 if(
					(filter && player && ad.name == player)
					||
					(!filter && player == null)
				 ) {
					assists += ad.num;
				}
			 });
			 
			 Ext.each(entry.shotData, function(sd) {
				 if(
					(filter && player && sd.name == player)
					||
					(!filter && player == null)
				 ) {
					shots += sd.num;
				}
			 });
			 
			 ret.push({
				 game: game,
				 date: entry.date,
				 opponent: entry.opponent,
				 scrimmage: entry.scrimmage,
				 goalsFor: entry.goalsFor,
				 goalsAgainst: entry.goalsAgainst,
				 goals: goals,
				 assists: assists,
				 shots: shots
			 });
			 
			 game++;
		});
		
		return ret;
	},
	
	/**
 	 * @function
 	 */
 	buildChartTitle: function() {
	 	var me = this;
	 	
	 	var ret = me.baseTitle;
	 	
	 	if(me.currentYDataMetric == 'assists') {
		 	ret = ret + ' - Assists';
		} else {
			ret = ret + ' - Goals';
		}
		
		ret = ret + ' (' + me.currentPlayerSelection + ')';
		
		return ret;
	},
	
	/**
	 * @function
	 */
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
		
		me.currentYDataMetric = btn.metric;
		if(btn.metric == 'assists') {
			me.lineChart.setLabelFunction(function(d, i) {
				return d.opponent + ' (' + d.assists + ')' + (d.scrimmage ? ' *' : '');
			});
		} else if(btn.metric == 'shots') {
			me.lineChart.setLabelFunction(function(d, i) {
				return d.opponent + ' (' + d.shots + ')' + (d.scrimmage ? ' *' : '');
			});
		} else {
			me.lineChart.setLabelFunction(function(d, i) {
				return d.opponent + ' (' + d.goals + ')' + (d.scrimmage ? ' *' : '');
			});
		}
		
		me.lineChart.setChartTitle(me.buildChartTitle());
		me.lineChart.setYDataMetric(btn.metric);
		me.lineChart.draw();
	}
});