/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.TeamMatchup', {
	extend: 'Ext.Panel',
	alias: 'widget.daaTeamMatchup',
	title: 'Scoring by Game',
	closable: false,
	
	requires: [
		'App.store.daa.SeasonMetaStore',
		'App.util.d3.UniversalStackedBar'
	],
	
	initComponent: function() {
		var me = this;
		
		me.rawData = [],
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.seasonId = null,
 			me.seasonName = null,
 			me.stackedBarChart = null,
 			me.currentMetric = 'total',
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
					me.stackedBarChart.setChartTitle('Scoring by Game - ' + record[0].data.seasonName);
					me.getData();
				},
				scope: me
			}
		});
		
		me.customizeButton = Ext.create('Ext.button.Button', {
			disabled: true,
			iconCls: 'icon-tools',
			text: 'Orientation',
			menu: [{
				text: 'Vertical',
				iconCls: 'icon-bar-chart',
				orientationValue: 'vertical',
				handler: me.orientationHandler,
				scope: me
			}, {
				text: 'Horizontal',
				iconCls: 'icon-bar-chart-hoz',
				orientationValue: 'horizontal',
				handler: me.orientationHandler,
				scope: me
			}]
		});
		
		me.scrimmageToggler = Ext.create('Ext.form.field.Checkbox', {
			disabled: true,
			boxLabel: 'Exclude Scrimmages',
			listeners: {
				change: function(cbx, oldVal, newVal) {
					if(cbx.checked) {
						me.stackedBarChart.setGraphData(me.filterScrimmages());
					} else {
						me.stackedBarChart.setGraphData(me.graphData);
					}
					me.stackedBarChart.draw();
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
				{xtype: 'tbspacer', width: 10},
				me.customizeButton,
				{xtype: 'tbspacer', width: 10},
				me.scrimmageToggler,
				'->',
				{xtype: 'tbtext', text: '<i>* = scrimmage</i>'},
				{xtype: 'tbspacer', width: 10}
			]
		}];
 		
 		////////////////////////////////////////
 		// @listeners
 		////////////////////////////////////////
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
			 	
			 	me.initCanvas(me);
		 	},
		 	scope: me
		});
	},
	
 	/**
 	 * @function
 	 * @memberOf App.view.d3.bar.StackedBar
 	 * @description Initialize the drawing canvas
 	 */
 	initCanvas: function() {
 		var me = this;
 		
	 	// initialize SVG, width, height
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
				right: 10,
				bottom: 50,
				left: 80
			},
			chartTitle: 'Scoring by Game - ' + me.seasonName,
			showLabels: true,
			showLegend: true,
			spaceBetweenChartAndLegend: 30,
			labelFunction: function(d, i) {
				return d.goalLabel;
			},
			colorPalette: 'custom',
			colorScale: d3.scale.ordinal().range(['#006400', '#B22222']),
			tooltipFunction: function(d, i) {
				var ret = '<b>vs ' + d.opponent + '</b><br><br>';
				
				ret = ret + 'Date: ' + d.gameDate + '<br>';
				
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
			}
		});
		
		me.getData();
	},
	
	getData: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		
		if(me.seasonId == null) {
			me.seasonId = 'F14';
		}
	
		Ext.Ajax.request({
			url: 'data/daa/game' + me.seasonId + '.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.rawData = resp;
	 			me.graphData = me.normalizeData(resp);
		 		me.stackedBarChart.setGraphData(me.graphData);
		 		if(me.stackedBarChart.chartInitialized) {
		 			me.stackedBarChart.draw();
		 		} else {
		 			me.stackedBarChart.initChart().draw();
		 			
					me.customizeButton.setDisabled(false);
			 		me.scrimmageToggler.setDisabled(false);
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
	 */
	normalizeData: function(obj) {
		var me = this,
			ret = [],
			us = [],
			them = [],
			gameNum = 1,
			id;
			
		Ext.each(obj, function(entry) {
			id = 'Game ' + gameNum;
			if(entry.scrimmage) {
				id = id + ' *';
			}
			
			var gf = entry.goalsFor > 0 ? entry.goalsFor : '0';
			var ga = entry.goalsAgainst > 0 ? entry.goalsAgainst : '0';

			us.push({
				id: id,
				category: 'DAA',
				scrimmage: entry.scrimmage,
				y: entry.goalsFor,
				goalsFor: entry.goalsFor,
				goalsAgainst: entry.goalsAgainst,
				goalLabel: 'DAA (' + gf + ')',
				opponent: entry.opponent,
				gameDate: entry.gameDate
			});
			
			them.push({
				id: id,
				category: 'Opponent',
				scrimmage: entry.scrimmage,
				y: entry.goalsAgainst,
				goalsFor: entry.goalsFor,
				goalsAgainst: entry.goalsAgainst,
				goalLabel: entry.opponent + ' (' + ga + ')',
				opponent: entry.opponent,
				gameDate: entry.gameDate
			});
			
			gameNum++;
		});
		
		ret.push({
			category: 'DAA',
			values: us
		}, {	
			category: 'Opponent',
			values: them
		});
		
		return ret;
	},
	
	/**
 	 * @function
 	 * @description Filter out scrimmage records
 	 */
 	filterScrimmages: function() {
	 	var me = this, ret = [];
	 	
	 	Ext.each(me.graphData, function(d) {
		 	var category = d.category, newValues = [];
		 	
		 	Ext.each(d.values, function(v) {
			 	if(!v.scrimmage) {
				 	newValues.push(v);
				}
			});
		 	
		 	ret.push({
			 	category: category,
			 	values: newValues
			});
		});
		
		return ret;
	},
	
	/**
 	 * @function
 	 * @description Change the stacked bar orientation (horizontal | vertical)
 	 */
	orientationHandler: function(btn) {
		var me = this;
	
		me.stackedBarChart.setOrientation(btn.orientationValue);
		me.stackedBarChart.draw();
	}
});