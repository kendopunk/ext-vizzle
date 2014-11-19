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
		
		me.chartDescription = '<b>Advanced Grouped Bar</b>';
		me.eventRelay = Ext.create('App.util.MessageBus');
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'button',
				text: 'Drilldown'
			},
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
				text: 'Randomize',
				handler: function() {
					me.groupedBarChart.setPrimaryGrouper('category');
		me.groupedBarChart.setSecondaryGrouper('fy');
		me.groupedBarChart.setTertiaryGrouper('budgetType');	
					me.groupedBarChart.setGraphData(me.buildGraphData()).draw();
				},
				scope: me
			},
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
				text: 'Legend OFF',
				handler: function() {
					me.groupedBarChart.setShowLegend(false);
					me.groupedBarChart.draw();
				},
				scope: me
			},
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
				text: 'Legend ON',
				handler: function() {
					me.groupedBarChart.setShowLegend(true);
					me.groupedBarChart.draw();
				},
				scope: me
			},
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
				text: 'New Data',
				handler: function() {
					me.groupedBarChart.setPrimaryGrouper('category');
		me.groupedBarChart.setSecondaryGrouper('fy');
		me.groupedBarChart.setTertiaryGrouper('budgetType');	
					me.groupedBarChart.setGraphData(me.buildAltGraphData()).draw();
				},
				scope: me
			},
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
				text: '<b>INVERSION</b>',
				handler: function() {
					me.groupedBarChart.setPrimaryGrouper('fy');
					me.groupedBarChart.setSecondaryGrouper('category');
					me.groupedBarChart.setTertiaryGrouper('budgetType');
					
					var temp = Ext.clone(me.groupedBarChart.graphData);
					temp.sort(App.util.Global.sortUtils.dynamicMultiSort('fy', 'category', 'budgetType'));
					var ind = 0;
					Ext.each(temp, function(item) {
						temp.id = ind;
						ind++;
					});
					
					me.groupedBarChart.setGraphData(temp).draw();
					
					
				},
				scope: me
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
			colorDefinedInData: true,
			graphData: me.buildGraphData(),
			margins: {
				top: 30,
				right: 10,
				bottom: 50,
				bottomText: 20,
				left: 80,
				leftAxis: 70
			},
			primaryGrouper: 'category',
			secondaryGrouper: 'fy',
			tertiaryGrouper: 'budgetType',
			
			tooltipFunction: function(d, i) {
				return d.id + '/' + d.fy + '<br>'
					+ d.budgetType + '<br>'
					+ d.value;
				//return d.id + '<br>' + d.value;
				//return Ext.util.Format.currency(d.value, false, '0', false);
			},
			yDataMetric: 'value',
			yTickFormat: function(d) {
				return Ext.util.Format.currency(d, false, '0', false);
			}
		});
		
		/*var s1 = d3.scale.ordinal().domain([1, 2, 3]).rangeRoundBands([0, 100], 0, 0);
		console.log(s1.range());
		console.log(s1.rangeBand());
		
		var s2 = d3.scale.ordinal().domain([1, 2, 3]).rangeRoundBands([0, 100], .1, .1);
		console.log(s2.range());
		console.log(s2.rangeBand());
		
		var s3 = d3.scale.ordinal().domain([1, 2, 3]).rangeRoundBands([0, 100], .2, .1);
		console.log(s3.range());
		console.log(s3.rangeBand());
		
		
		var s2 = d3.scale.ordinal().domain([1, 2, 3]).rangeBands([0, 100], .1, .1);
		
		var o1 = d3.scale.ordinal().domain([1, 2, 3]).rangeBands([0, 100], 0, 0);
o1.range(); //returns [0, 33.333333333333336, 66.66666666666667]
o1.rangeBand(); //returns 33.333333333333336
var o2 = d3.scale.ordinal().domain([1, 2, 3]).rangeRoundBands([0, 100], 0, 0);
o2.range(); //returns [1, 34, 67]
o2.rangeBand(); //returns 33
		*/
		me.groupedBarChart.initChart().draw();
	},
	
	/**
 	 * generate stub data
 	 */
	buildGraphData: function() {
		var me = this;
		
		var ret = [],
			//cats = ['Incentive', 'Travel', 'Training', 'Overtime'],
			cats = ['Incentive', 'Overtime', 'Travel'],
			fys = ['2011', '2012'],
			budgetTypes = [{
				name: 'Allocated',
				color: '#1F77B4'
			}, {
				name: 'Funds Used',
				color: '#AEC7E8'
			}],
			ind = 0;
			
		Ext.each(cats, function(c) {
			Ext.each(fys, function(fy) {
				Ext.each(budgetTypes, function(bt) {
					ret.push({
						category: c,
						fy: fy,
						budgetType: bt.name,
						color: bt.color,
						value: (Math.random() * 10000) + 1
					});
					ind++;
				});
			});
		});
		
		ret.sort(App.util.Global.sortUtils.dynamicMultiSort('category', 'fy', 'budgetType'));
		Ext.each(ret, function(item) {
			item.id = ind;
			ind++;
		});
		
		
		return ret;
	},
	
	/**
 	 * generate stub data
 	 */
	buildAltGraphData: function() {
		var me = this;
		
		var ret = [],
			cats = ['Personnel', 'HR', 'Accounting'],
			fys = ['2011', '2009'],
			budgetTypes = [{
				name: 'Budgeted',
				color: '#FFCC33'
			}, {
				name: 'Wasted',
				color: '#990066'
			}],
			ind = 0;

		Ext.each(cats, function(c) {
			Ext.each(fys, function(fy) {
				Ext.each(budgetTypes, function(bt) {
					ret.push({
						category: c,
						fy: fy,
						budgetType: bt.name,
						color: bt.color,
						value: (Math.random() * 10000) + 1
					});
					ind++;
				});
			});
		});
		
		ret.sort(App.util.Global.sortUtils.dynamicMultiSort('category', 'fy', 'budgetType'));
		Ext.each(ret, function(item) {
			item.id = ind;
			ind++;
		});
		
		return ret;
	}
});