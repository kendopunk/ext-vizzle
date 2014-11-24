/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Grouping bar chart
 */
Ext.define('App.view.d3.bar.GroupedBarAdv', {
	extend: 'Ext.Panel',
	alias: 'widget.barGroupAdvanced',
	title: 'Advanced Grouped Bar',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.AdvancedGroupedBar'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		me.chartDescription = '<b>Advanced Grouped Bar Chart</b><br>'
			+ '<i>Some MLB American League stats...</i><br><br>'
			+ '(1) The three primary properties (team, season, metric) are interchangeable as to their '
			+ 'position in chart (primary grouper, secondary grouper or bar).  Use the \"View\" '
			+ 'combo to see this in action.<br><br>'
			+ '(2) Makes good use of the various rangeBand-related properties of D3 ordinal scales.<br><br>'
			+ 'MLB team colors from <a href="http://probaseballupdates.com">probaseballupdates.com</a>.';

		me.availableSeasons = ['2014', '2013', '2012'],
			me.availableMetrics = [{
				name: 'Wins',
				property: 'wins'
			}, {
				name: 'Losses',
				property: 'losses'
			}, {
				name: 'Runs Scored',
				property: 'runsScored'
			}, {
				name: 'Runs Allowed',
				property: 'runsAllowed'
			}],
			me.cbxHighlightCss = 'btn-highlight-khaki',
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
			me.rawData = [],
			me.selectedSeasons = ['2014'],
			me.selectedMetrics = ['Wins', 'Losses'],
			me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
			
		////////////////////////////////////////
		// runtime configuration of season and
		// metric checkboxes
		////////////////////////////////////////
 		var seasonCheckboxData = [], metricCheckboxData = [];
 		
 		Ext.each(me.availableSeasons, function(season) {
			seasonCheckboxData.push(
				{
		 			xtype: 'checkboxfield',
			 	 	boxLabel: season,
			 	 	boxType: 'season',
			 	 	name: 'season',
			 	 	inputValue: season,
			 	 	cls: me.selectedSeasons.indexOf(season) >= 0 ? me.cbxHighlightCss : '',
			 	 	checked: me.selectedSeasons.indexOf(season) >= 0,
			 	 	listeners: {
				 	 	change: me.checkboxChange,
				 	 	scope: me
			 	 	}
		 		},
		 		{xtype: 'tbspacer', width: 5}
	 		);
	 	}, me);
	 	
	 	Ext.each(me.availableMetrics, function(metric) {
	 		metricCheckboxData.push(
				{
		 			xtype: 'checkboxfield',
			 	 	boxLabel: metric.name,
			 	 	boxType: 'metric',
			 	 	name: 'metric',
			 	 	inputValue: metric.name,
			 	 	cls: me.selectedMetrics.indexOf(metric.name) >= 0 ? me.cbxHighlightCss : '',
			 	 	checked: me.selectedMetrics.indexOf(metric.name) >= 0,
			 	 	listeners: {
				 	 	change: me.checkboxChange,
				 	 	scope: me
			 	 	}
		 		},
		 		{xtype: 'tbspacer', width: 5}
	 		);
	 	});
		
		me.viewCombo = Ext.create('Ext.form.field.ComboBox', {
	 		store: Ext.create('Ext.data.Store', {
			 	fields: ['display', 'value'],
			 	data: [
			 		{display: 'Team -> Season -> Metric', value: 'tsm'},
			 		{display: 'Team -> Metric -> Season', value: 'tms'},
			 		{display: 'Season -> Team -> Metric', value: 'stm'},
			 		{display: 'Season -> Metric -> Team', value: 'smt'},
			 		{display: 'Metric -> Team -> Season', value: 'mts'},
			 		{display: 'Metric -> Season -> Team', value: 'mst'}
			 	]
			}),
			displayField: 'display',
	 		valueField: 'value',
	 		editable: false,
		 	typeAhead: true,
		 	queryMode: 'local',
		 	triggerAction: 'all',
		 	width: 200,
		 	listWidth: 200,
		 	value: 'tsm',
		 	listeners: {
			 	select: function(combo) {
				 	me.setGroupers(combo.getValue());
			 	},
			 	scope: me
			}
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Season(s):</b>'
			},
			{xtype: 'tbspacer', width: 5},
			seasonCheckboxData,
			{xtype: 'tbspacer', width: 15},
			{
				xtype: 'tbtext',
				text: '<b>Metric(s):</b>'
			},
			{xtype: 'tbspacer', width: 5},
			metricCheckboxData,
			'->',
			{
				xtype: 'button',
				iconCls: 'icon-tools',
				text: 'Customize',
				menu: [{
					xtype: 'menucheckitem',
					text: 'Labels',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.groupedBarChart.setShowLabels(checked);
							me.groupedBarChart.draw();
						},
						scope: me
					}
				}, {
					xtype: 'menucheckitem',
					text: 'Legend',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.groupedBarChart.setShowLegend(checked);
							me.groupedBarChart.draw();
						},
						scope: me
					}
				}]
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 10
			}]
		}, {
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>View:</b>'
			},
				me.viewCombo
			]
		}];
		
		////////////////////////////////////////
		// @listeners
		////////////////////////////////////////
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		me.on('afterrender', me.initCanvas, me);
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.bar.GroupedBar
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function(panel) {
	 	var me = this;
	 	
	 	me.getEl().mask('Loading...');
	 	
	 	// width, height
	 	me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
		 	.append('svg')
		 	.attr('width', me.canvasWidth)
		 	.attr('height', me.canvasHeight);
		 	
		me.groupedBarChart = Ext.create('App.util.d3.AdvancedGroupedBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			chartFlex: 5,
			colorDefinedInData: true,
			graphData: me.graphData,
			legendFlex: 1,
			margins: {
				top: 30,
				right: 10,
				bottom: 70,
				bottomText: 30,
				left: 80,
				leftAxis: 70
			},
			primaryGrouper: 'team',
			secondaryGrouper: 'season',
			tertiaryGrouper: 'metric',
			tooltipFunction: function(d, i) {
				return '<b>' + d.team + '</b><br>'
					+ '<b>Season:</b> '
					+ d.season
					+ '<br><b>' + d.metric + ': </b>'
					+ Ext.util.Format.number(d.value, '0,000');
			},
			yDataMetric: 'value',
			yTickFormat: function(d) {
				return Ext.util.Format.number(d, '0,000');
			}
		});
		
		Ext.Ajax.request({
			url: 'data/baseball.json',
			method: 'GET',
			success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				
				// stash
				me.rawData = resp.data;
				
				var filteredData = me.filterAndNormalizeData(me.rawData,
					me.getSelectedSeasons(),
					me.getSelectedMetrics()
				);
				
				me.groupedBarChart.setGraphData(
					me.colorizeAndIndex(filteredData)
				).initChart().draw();
			},
			callback: function() {
				me.getEl().unmask();
			},
			scope: me
		});
	},
	
	/**
 	 * @function
 	 * @description Filter data by season and metric and put
 	 * into chart-consumable format
 	 */
	filterAndNormalizeData: function(dat, seasons, metrics) {
		var me = this,
			ret = [],
			coll = Ext.create('Ext.util.MixedCollection');
		
		// get unique teams
		var teams = Ext.Array.sort(Ext.Array.unique(Ext.Array.map(dat, function(d) {
			return d.team;
		})));
		
		// build the mixed collection for metric property->name
		// mapping
		Ext.each(me.availableMetrics, function(am) {
			coll.add(am.property, am.name);
		}, me);
		
		// normalize the data
		Ext.each(metrics, function(m) {
			Ext.each(dat, function(d) {
				if(teams.indexOf(d.team) >= 0 && seasons.indexOf(d.season) >= 0) {
					ret.push({
						team: d.team,
						season: d.season,
						metric: coll.getByKey(m),
						value: d[m]
					});
				}
			});
		}, me);
		
		return ret;
	},
	
	/**
 	 * @function
 	 * @description Handle changes to season or metric checkboxes
 	 */
	checkboxChange: function(cbx, oldVal, newVal) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.cbxHighlightCss);
		} else {
			cbx.removeCls(me.cbxHighlightCss);
		}
		
		var seasons = me.getSelectedSeasons();
		var metrics = me.getSelectedMetrics();
		
		if(seasons.length == 0 || metrics.length == 0) {
			return;
		}
		
		me.groupedBarChart.setGraphData(
			me.colorizeAndIndex(
				me.filterAndNormalizeData(me.rawData, seasons, metrics)
			)
		).draw();
	},
	
	/**
 	 * @function
 	 * @description Add unique indices and colorize the data
 	 */
	colorizeAndIndex: function(dat) {
		var me = this,
			ind = 0,
			cs,
			p = me.groupedBarChart.getPrimaryGrouper(),
			s = me.groupedBarChart.getSecondaryGrouper(),
			t = me.groupedBarChart.getTertiaryGrouper();
			
		// based on what the tertiary grouper is, set the color scale
		if(t == 'team') {
			cs = ['#F4632A', '#C60C30', '#10293F'];
		} else {
			cs = colorbrewer.Paired[12];
		}
		
		// sort it
		dat.sort(App.util.Global.sortUtils.dynamicMultiSort(p, s, t));
			
		// make the color mapper
		var colorMapper = Ext.Array.map(
			Ext.Array.unique(
				Ext.Array.sort(
					Ext.Array.pluck(dat, t)
			)),
			function(item, index) {
				return {
					name: item,
					color: cs[index]
				};
			}
		);
		
		// add IDs and color
		Ext.each(dat, function(item) {
			item.id = ind;
			
			item.color = Ext.Array.filter(colorMapper, function(entry) {
				return entry.name == item[t];
			})[0].color;
			
			ind++;
		});
		
		return dat;
	},
	
	/**
	 * @function
	 * @description Get unique list of season checkbox values (checked only)
	 */
	getSelectedSeasons: function() {
		var me = this;
		
		return Ext.Array.map(
			Ext.Array.filter(me.query('toolbar[dock=top] checkboxfield[boxType=season]'), function(cbx) {
				return cbx.checked;
			}, me), function(item) {
				return item.inputValue;
			}
		);
	},
	
	/**
 	 * @function
 	 * @description Get a unique list of metric checkbox values (checked only)
 	 */
	getSelectedMetrics: function() {
		var me = this,
			ret = [];
		
		var arr = Ext.Array.map(
			Ext.Array.filter(me.query('toolbar[dock=top] checkboxfield[boxType=metric]'), function(cbx) {
				return cbx.checked;
			}, me), function(item) {
				return item.inputValue;
			}
		);
		
		Ext.each(me.availableMetrics, function(am) {
			if(arr.indexOf(am.name) >= 0) {
				ret.push(am.property);
			}
		});
		
		return ret;
	},
	
	/**
	 * @function
	 */
	setGroupers: function(code) {
		var me = this;
		
		var seasons = me.getSelectedSeasons();
		var metrics = me.getSelectedMetrics();
		
		if(seasons.length == 0 || metrics.length == 0) {
			return;
		}
		
		switch(code) {
			case 'tms':
			me.groupedBarChart.setPrimaryGrouper('team');
			me.groupedBarChart.setSecondaryGrouper('metric');
			me.groupedBarChart.setTertiaryGrouper('season');
			break;
			
			case 'stm':
			me.groupedBarChart.setPrimaryGrouper('season');
			me.groupedBarChart.setSecondaryGrouper('team');
			me.groupedBarChart.setTertiaryGrouper('metric');
			break;
			
			case 'smt':
			me.groupedBarChart.setPrimaryGrouper('season');
			me.groupedBarChart.setSecondaryGrouper('metric');
			me.groupedBarChart.setTertiaryGrouper('team');
			break;
			
			case 'mts':
			me.groupedBarChart.setPrimaryGrouper('metric');
			me.groupedBarChart.setSecondaryGrouper('team');
			me.groupedBarChart.setTertiaryGrouper('season');
			break;
			
			case 'mst':
			me.groupedBarChart.setPrimaryGrouper('metric');
			me.groupedBarChart.setSecondaryGrouper('season');
			me.groupedBarChart.setTertiaryGrouper('team');
			break;
			
			default:
			me.groupedBarChart.setPrimaryGrouper('team');
			me.groupedBarChart.setSecondaryGrouper('season');
			me.groupedBarChart.setTertiaryGrouper('metric');
			break;
		}
		
		me.groupedBarChart.setGraphData(
			me.colorizeAndIndex(
				me.filterAndNormalizeData(me.rawData, seasons, metrics)
			)
		).draw();
	}
});