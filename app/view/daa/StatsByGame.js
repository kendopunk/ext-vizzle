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
			me.dataProperty = 'goalData',
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
					me.statsCombo.enable();
					me.gameId = combo.getValue();
					me.genChart();
				},
				scope: me
			}
		});
		
		// metric selector
		me.statsCombo = Ext.create('Ext.form.field.ComboBox', {
			disabled: true,
			store: Ext.create('Ext.data.Store', {
				fields: ['display', 'value'],
				data: [
					{display: 'Goals', value: 'goalData'},
					{display: 'Assists', value: 'assistData'},
					{display: 'Shots on Goal', value: 'shotData'},
					{display: 'Goalkeeper - Saves', value: 'saveData'},
					{display: 'Goalkeeper - Shots Against', value: 'shotsAgainst'},
					{display: 'Goalkeeper - Goals Against', value: 'shotsScored'}
				]
			}),
			displayField: 'display',
			valueField: 'value',
			queryMode: 'local',
			triggerAction: 'all',
			width: 200,
			listWidth: 200,
			value: 'goalData',
			listeners: {
				select: function(combo) {
					me.dataProperty = combo.getValue();
					me.genChart();
				},
				scope: me
			}
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
				width: 10
			}, {
				xtype: 'tbtext',
				text: '<b>Select Stat:</b>'
			},
				me.statsCombo
			]
		}];
		
		me.on('afterrender', me.initData, me);
		
		me.callParent(arguments);
	},
	
	initData: function(panel) {
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

		// init pie chart
		me.pieChart = Ext.create('App.util.d3.UniversalPie', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			panelId: me.panelId,
			dataMetric: 'value',
			chartFlex: 4,
			legendFlex: 1,
			colorPalette: 'gradient_blue',
			margins: {
				top: 40
			},
			chartTitle: 'foo',
			showLabels: true,
			labelFunction: function(d, i) {
				return d.data.name;
			},
			showLegend: true,
			legendTextFunction: function(d, i) {
				return d.name + ' (' + d.value + ')';
			},
			tooltipFunction: function(d, i) {
				return '<b>' + d.data.name + '</b><br>'
					+ d.data.value;
			}
		});
		
		// get data
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
	
	genChart: function() {
		
		var me = this, 
			dat = [];
		
		Ext.each(me.gameData, function(gd) {
			if(gd.id == me.gameId) {
				me.currentOpponent = gd.opponent;
				var slice = gd[me.dataProperty];
				
				Ext.each(slice, function(s) {
					dat.push({
						name: s.name,
						value: s.num
					});
				});
			}
		}, me);
		
		me.pieChart.setGraphData(Ext.Array.sort(dat, function(a, b) {
			if(a.value > b.value) { return -1; }
			else if(a.value < b.value) { return 1; }
			return 0
		}));
		
		switch(me.dataProperty) {
			
			case 'assistData':
			me.pieChart.setChartTitle(me.currentOpponent + ' : Assists');
			break;
			
			case 'shotData':
			me.pieChart.setChartTitle(me.currentOpponent + ' : Shots on Goal');
			break;
			
			case 'saveData':
			me.pieChart.setChartTitle(me.currentOpponent + ' : Goalkeeper - Saves');
			break;
			
			case 'shotsAgainst':
			me.pieChart.setChartTitle(me.currentOpponent + ' : Goalkeeper - Shots Against');
			break;
			
			case 'shotsScored':
			me.pieChart.setChartTitle(me.currentOpponent + ' : Goalkeeper - Goals Against');
			break;
					
			default:
			me.pieChart.setChartTitle(me.currentOpponent + ' : Goals');
			break;
		}
		
		if(!me.pieChart.chartInitialized) {
			me.pieChart.initChart().draw();
		} else {
			me.pieChart.draw();
		}
	}
});