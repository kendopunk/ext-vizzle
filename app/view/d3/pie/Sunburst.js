/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Sunburst partition layout
 */
Ext.define('App.view.d3.pie.Sunburst', {
	extend: 'Ext.Panel',
	alias: 'widget.sunburstPartition',
	title: 'Sunburst Partitionasdfasfds',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.RadialTree'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.currentMetric = 'wins',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Sunburst/Radial Tree</b><br><br>'
			+ '<i>PGA Tour wins, majors and career earnings by geographic region.</i><br><br>'
			+ 'Data from <a href="http://www.pgatour.com">pgatour.com</a> and '
			+ '<a href="http://www.databasegolf.com">databasegolf.com</a>.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt(Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.dockedItems = [{
		 	xtype: 'toolbar',
		 	dock: 'top',
		 	items: [{
				xtype: 'button',
				text: 'Career Wins',
				cls: me.btnHighlightCss,
				metricName: 'wins',
				handler: me.metricHandler,
				scope: me
			}, 
			'-',
			{
				xtype: 'button',
				text: 'Majors',
				metricName: 'majors',
				handler: me.metricHandler,
				scope: me
			},
			'-',
			{
				xtype: 'button',
				text: 'Earnings',
				metricName: 'money',
				handler: me.metricHandler,
				scope: me
			},
			/*'->',
			{
				xtype: 'button',
				text: 'NEW DATA SET',
				handler: function(b, e) {
					me.radialChart.setGraphData(me.generateData(), true);
				},
				scope: me
			}*/]
		}];
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		// after render, initialize the canvas
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.pie.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
	 	
	 	me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
 			me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
 			
 		me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight)
	 		.attr('transform', 'translate(' + Math.floor(me.canvasWidth/2) + ',' + Math.floor(me.canvasHeight/2) + ')');
	 	
	 	Ext.Ajax.request({
		 	url: 'data/golfers.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				
	 			me.radialChart = Ext.create('App.util.d3.final.RadialTree', {
		 			svg: me.svg,
		 			canvasWidth: me.canvasWidth,
		 			canvasHeight: me.canvasHeight,
		 			graphData: resp,
		 			panelId: me.panelId,
		 			dataMetric: me.currentMetric
		 		}, me);
	 			
	 			me.radialChart.draw();
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	 	
	 	/*me.radialChart = Ext.create('App.util.d3.final.RadialTree', {
		 	svg: me.svg,
		 	canvasWidth: me.canvasWidth,
		 	canvasHeight: me.canvasHeight,
		 	graphData: me.generateData(),
		 	panelId: me.panelId,
		 	dataMetric: me.currentMetric
		 }, me);
		 
		me.radialChart.draw();*/
	},
	
	/**
	 * @function
	 * @description Handle metric change
	 */
	metricHandler: function(btn, evt) {
		var me = this;
	 	
	 	// remove then add the cls
	 	Ext.each(me.getDockedItems()[0].query('button'), function(btn) {
		 	btn.removeCls(me.btnHighlightCss);
		}, me);
		btn.addCls(me.btnHighlightCss);
		
		me.currentMetric = btn.metricName;
		me.radialChart.setDataMetric(btn.metricName);
		me.radialChart.transition();
		
		return;
	},
	
	generateData: function() {
		var ret = [],
			countries = ['USA', 'Canada', 'Mexico'];
			
		Ext.each(countries, function(c) {
			var temp = {
				name: c,
				children: []
			};
			
			for(i=0; i<Math.ceil(Math.random() * 10) + 1; i++) {
				temp.children.push({
					name: Math.random().toString(36).substring(7),
					wins: Math.floor(Math.random() * 10) + 1,
					majors: Math.floor(Math.random() * 10) + 1,
					money: Math.floor(Math.random() * 50000) + 1
				});
		
			}
			
			ret.push(temp);
		});
			
	
		return {name: 'root', children: ret};
	}
});