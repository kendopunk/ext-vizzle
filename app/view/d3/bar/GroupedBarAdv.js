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
				text: 'Randomize'
			}]
			/*items: [{
				xtype: 'button',
				text: 'foo',
				handler: function() {
					me.groupedBarChart.primaryTickPadding = 25;
					
					me.groupedBarChart.setMarginProperty('bottom', 100);
					me.groupedBarChart.setPrimaryTickPadding(60);
					
					me.groupedBarChart.draw();
				
				},
				scope: me
			}, {
				xtype: 'button',
				text: 'Randomize',
				handler: function() {
					me.groupedBarChart.setGraphData(me.buildGraphData()).draw();
				},
				scope: me
			
			
			}]*/
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
				left: 80,
				leftAxis: 70
			},
			primaryGrouper: 'category',
			secondaryGrouper: 'budgetType',
			yDataMetric: 'value'
		});
		
		me.groupedBarChart.initChart().draw();
	},
	
	/**
 	 * generate stub data
 	 */
	buildGraphData: function() {
		var ret = [];
		var categories = ['Incentive', 'Overtime', 'Travel', 'Training'];
		var budgetTypes = [{
			name: 'Funds Used',
			color: '#336699'
		}, {
			name: 'Allocated',
			color: '#FFCC33'
		}];
		var ind = 0;
		
		Ext.each(categories, function(c) {
			Ext.each(budgetTypes, function(bt) {
				ret.push({
					id: ind,
					category: c,
					budgetType: bt.name,
					color: bt.color,
					value: ((Math.random() * 100000) + 1).toFixed(2)
				});
				ind++;
			})
		});
		
		return ret;
	}
});