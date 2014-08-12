/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.daa
 * @description
 */
Ext.define('App.view.daa.Individual', {
	extend: 'Ext.Panel',
	alias: 'widget.daaIndividual',
	title: 'Individual Stats',
	closable: false,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalGroupedBar'
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
 			me.rawData = [],
 			me.svg,
 			me.g,
 			me.panelId,
 			me.groupedBarChart = null,
 			me.currentView = 'absolute',
 			me.cbxHighlightCss = 'btn-highlight-khaki';
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.baseTitle = 'Fall 2014';
		
		////////////////////////////////////////
		// runtime configuration of checkboxes
		////////////////////////////////////////
		var checkboxData = [];
		var arr = [{
			display: 'Goals',
			value: 'goals'
		}, {
			display: 'Assists',
			value: 'assists'
		}, {
			display: 'Shots on Goal',
			value: 'shots'
		}, {
			display: 'Saves',
			value: 'saves'
		}];
		Ext.each(arr, function(item) {
			checkboxData.push({
				xtype: 'checkboxfield',
				boxLabel: item.display,
				name: 'metrics',
				inputValue: item.value,
				cls: item.value == 'goals' ? me.cbxHighlightCss : '',
				checked: item.value == 'goals' ? true : false,
				listeners: {
					change: me.checkboxChange,
					scope: me
				}
			}, {xtype: 'tbspacer', width: 7});
		}, me);
	 	
	 	////////////////////////////////////////
	 	// grid store
	 	////////////////////////////////////////
		me.store = Ext.create('Ext.data.Store', {
			fields: [
				{name: 'player', type: 'string'},
				{name: 'goals', type: 'auto'},
				{name: 'avgGoals', type: 'auto'},
				{name: 'assists', type: 'auto'},
				{name: 'avgAssists', type: 'auto'},
				{name: 'shots', type: 'auto'},
				{name: 'avgShots', type: 'auto'}
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
				},
				checkboxData,
				{
					xtype: 'tbspacer',
					width: 25
				}, {
					xtype: 'tbtext',
					text: '<b>View:</b>'
				}, {
					xtype: 'combo',
					store: Ext.create('Ext.data.Store', {
						fields: ['display', 'value'],
						data: [{
							display: 'Totals', value: 'absolute'
						}, {
							display: 'Averages per Game', value: 'average'
						}]
					}),
					displayField: 'display',
					valueField: 'value',
					editable: false,
					queryMode: 'local',
					triggerAction: 'all',
					width: 150,
					listWidth: 150,
					value: 'absolute',
					listeners: {
						select: function(combo) {
							me.currentView = combo.getValue();
							
							if(combo.getValue() == 'average') {
								me.groupedBarChart.setTooltipFunction(function(d, i) {
									return '<b>' + d.grouper + '</b><br>'
									+ Ext.util.Format.number(d.value, '0,000.00')
									+ ' '
									+ d.name + ' per game';
								});
							} else {
								me.groupedBarChart.setTooltipFunction(function(d, i) {
									return '<b>' + d.grouper + '</b><br>'
									+ Ext.util.Format.number(d.value, '0,000')
									+ ' '
									+ d.name;
								});
							
							}
								
							me.groupedBarChart.setGraphData(me.filterData());
							me.groupedBarChart.draw();
						},
						scope: me
					}
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
				header: 'Goals/Game',
				dataIndex: 'avgGoals',
				width: 100,
				renderer: function(v) {
					return Ext.util.Format.number(v, '0.00');
				}
			}, {
				header: 'Assists',
				dataIndex: 'assists',
				width: 100
			}, {
				header: 'Assists/Game',
				dataIndex: 'avgAssists',
				width: 100,
				renderer: function(v) {
					return Ext.util.Format.number(v, '0.00');
				}
			}, {
				header: 'Shots',
				dataIndex: 'shots',
				width: 100
			}, {
				header: 'Shots/Game',
				dataIndex: 'avgShots',
				width: 100,
				renderer: function(v) {
					return Ext.util.Format.number(v, '0.00');
				}
			}, ]
		});
		
		me.items = [ me.vizPanel, me.gridPanel ];
		
		me.on('beforerender', me.initPlayerData, me);

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
		 			item.avgGoals = 0;
		 			item.assists = 0;
		 			item.avgAssists = 0;
		 			item.shots = 0;
		 			item.avgShots = 0;
		 			item.saves = 0;
		 			item.avgSaves = 0;
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
	 		
	 	me.groupedBarChart = Ext.create('App.util.d3.UniversalGroupedBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			chartTitle: me.baseTitle + ' - Individual Statistics',
			fixedColorRange: {
				'goals': '#4682B4',
				'assists': '#CD853F',
				'shots': '#b2df8a',
				'saves': '#808000'
			},
			fixedColorRangeIndex: 'name',
			margins: {
				top: 40,
				right: 10,
				bottom: 40,
				left: 80,
				leftAxis: 70
			},
			yTickFormat: function(d) {
				return Ext.util.Format.number(d, '0.0');
			},
			tooltipFunction: function(d, i) {
				return '<b>' + d.grouper + '</b><br>'
					+ Ext.util.Format.number(d.value, '0,000')
					+ ' '
					+ d.name;
			},
			chartFlex: 5,
			legendFlex: 1,
			showLegend: true,
			showLabels: false
		});
		
		// get data
		Ext.Ajax.request({
			url: 'data/daa/gamedata.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				me.rawData = me.normalizeData(resp.data);
				
				me.store.loadData(me.rawData);
				
				me.groupedBarChart.setGraphData(me.filterData());
				me.groupedBarChart.initChart().draw();
				me.groupedBarChart.triggerGroupers(false);
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
	 			
	 			Ext.each(a.shotData, function(sd) {
		 			if(sd.name == playerName) {
			 			player.shots += sd.num;
			 		}
			 	});
			 	
			 	Ext.each(a.saveData, function(vd) {
				 	if(vd.name == playerName) {
					 	player.saves = vd.num;
					}
				});

	 		});
	 	});
	 	
	 	// calculate averages
	 	Ext.each(dat, function(d) {
	 		d.avgGoals = d.gamesPlayed == 0 ? 0 : d.goals/d.gamesPlayed;
	 		d.avgAssists = d.gamesPlayed == 0 ? 0 : d.assists/d.gamesPlayed;
	 		d.avgShots = d.gamesPlayed == 0 ? 0 : d.shots/d.gamesPlayed;
	 		d.avgSaves = d.gamesPlayed == 0 ? 0 : d.saves/d.gamesPlayed;
	 	});
	 	
	 	return dat;
 	},
 	
 	/**
 	 * @function
 	 * @description Filter the baseline raw data based on metrics
 	 */
 	filterData: function() {
	 	var me = this,
	 		filterData = [],
		 	ret = [];
		 	
		var currentView = me.currentView;
	 	
	 	////////////////////////////////////////
	 	// figure out the checkboxes to filter on
	 	////////////////////////////////////////
	 	var checkboxes = me.query('toolbar[dock=top] checkboxfield');
		if(checkboxes.length == 0) {
			return [];
		}
		
		Ext.each(checkboxes, function(cbx) {
			if(cbx.checked) {
				filterData.push(cbx.inputValue);
			}
		});
		
		if(filterData.length == 0) {
			return [];
		}
		
		var ind = 1;
		
		Ext.each(me.rawData, function(entry) {
		
			if(filterData.indexOf('goals') >= 0) {
				ret.push({
					id: ind,
					name: 'goals',
					grouper: entry.name,	// player
					value: currentView == 'average' ? entry.avgGoals : entry.goals
				});
				
				ind++;
			}
			
			if(filterData.indexOf('assists') >= 0) {
				ret.push({
					id: ind,
					name: 'assists',
					grouper: entry.name,
					value: currentView == 'average' ? entry.avgAssists : entry.assists
				});
				
				ind++;
			}
			
			if(filterData.indexOf('shots') >= 0) {
				ret.push({
					id: ind,
					name: 'shots',
					grouper: entry.name,
					value: currentView == 'average' ? entry.avgShots : entry.shots
				});
				
				ind++;
			}
			
			if(filterData.indexOf('saves') >= 0) {
				ret.push({
					id: ind,
					name: 'saves',
					grouper: entry.name,
					value: currentView == 'average' ? entry.avgSaves : entry.saves
				});
				
				ind++;
			}
		});

		return ret;
 	},
	
	/**
 	 * @function
 	 * @description Year checkbox change event handler
 	 * @param cbx Ext.form.field.Checkbox
 	 * @param oldVal String
 	 * @param newVal String
 	 */
	checkboxChange: function(cbx, oldVal, newVal) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.cbxHighlightCss);
		} else {
			cbx.removeCls(me.cbxHighlightCss);
		}
		
		me.groupedBarChart.setGraphData(me.filterData());
		me.groupedBarChart.draw();
		me.groupedBarChart.triggerGroupers(true);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.daa.Individual
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