/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Grouping bar chart
 */
Ext.define('App.view.d3.bar.GroupedBarAdv', {
	extend: 'Ext.Panel',
	alias: 'widget.barGroupAdvanced',
	title: 'Grouped Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.AdvancedGroupedBar'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		me.availableSeasons = ['2014', '2013', '2012'],
			me.selectedSeasons = ['2014'],
	 		me.chartDescription = '<b>Advanced Grouped Bar</b>',
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
			me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
			me.rawData = [],
			me.cbxHighlightCss = 'btn-highlight-khaki';
			
		/**
 		 * runtime configuration of checkboxes
 		 */
 		var checkboxData = [];
 		Ext.each(me.availableSeasons, function(season) {
			checkboxData.push({
	 			xtype: 'checkboxfield',
		 	 	boxLabel: season,
		 	 	name: 'season',
		 	 	inputValue: season,
		 	 	cls: me.selectedSeasons.indexOf(season) >= 0 ? me.cbxHighlightCss : '',
		 	 	checked: me.selectedSeasons.indexOf(season) >= 0,
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
		 	 	}
	 		},
	 		{xtype: 'tbspacer', width: 7}
	 		);
	 	}, me);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Season(s)</b>'
			},
			{
				xtype: 'tbspacer',
				width: 5
			},
			checkboxData,
			'->',
			{
				xtype: 'button',
				iconCls: 'icon-tools',
				text: 'Customize',
				menu: [/*{
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
				}, */{
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
		 	}]
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
				return '<b>' + d.team + '</b>'
					+ '<br>'
					+ d.season + ' ' + d.metric
					+ ': '
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
				
				me.rawData = resp.data;
				
				var filteredData = me.filterBySeason(me.rawData);
				
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
	
	checkboxChange: function(cbx, oldVal, newVal) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.cbxHighlightCss);
		} else {
			cbx.removeCls(me.cbxHighlightCss);
		}
		
		var filtered = me.filterBySeason(me.rawData);
		
		me.groupedBarChart.setGraphData(
			me.colorizeAndIndex(filtered)
		).draw();
	},
	
	/**
 	 * @function
 	 */
	filterBySeason: function(dat) {
		var me = this;
			
		var checkboxes = me.query('toolbar[dock=top] checkboxfield');
		
		if(checkboxes.length == 0) {
			return dat;
		}
		
		me.selectedSeasons = [];
		Ext.each(checkboxes, function(cbx) {
			if(cbx.checked) {
				me.selectedSeasons.push(cbx.inputValue);
			}
		}, me);
		
		var filtered = Ext.Array.filter(dat, function(item) {
			return me.selectedSeasons.indexOf(item.season) >= 0;
			//return me.selectedSeasons.indexOf(item.season) >= 0 && item.metric == 'Wins';
			
		}, me);
		
		return filtered;
	},
	
	/**
 	 * @function
 	 */
	colorizeAndIndex: function(dat) {
		var me = this,
			ind = 0,
			p = me.groupedBarChart.getPrimaryGrouper(),
			s = me.groupedBarChart.getSecondaryGrouper(),
			t = me.groupedBarChart.getTertiaryGrouper(),
			cs = d3.scale.category20();
		
		//console.debug(p);
		//console.debug(s);
		//console.debug(t);
		
		// sort it
		dat.sort(App.util.Global.sortUtils.dynamicMultiSort(p, s, t));
			
		// make the color mapper
		var colorMapper = Ext.Array.map(Ext.Array.unique(Ext.Array.sort(
			Ext.Array.pluck(dat, t)
		)), function(item, index) {
			return {
				name: item,
				color: cs(index)
			};
		});
		
		// add IDs and color
		Ext.each(dat, function(item) {
			item.id = ind;
			
			item.color = Ext.Array.filter(colorMapper, function(entry) {
				return entry.name == item[t];
			})[0].color;
			
			ind++;
		});
		
		return dat;
	}
});