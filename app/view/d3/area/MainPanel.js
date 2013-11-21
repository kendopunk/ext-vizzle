/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.area.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.areaMainPanel',
	title: 'Line/Area Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.LineChart'
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
 			me.baseDate = '8/31/2013',
 			me.baseTitle = 'Random Price Data over Time',
 			me.defaultXDataMetric = 'timestamp',
 			me.defaultYDataMetric = 'price',
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Line/Area Chart</b><br><br>'
		 + 'Base code from <i>bl.ocks.org/mbostock/3883195</i><br><br>'
		 + 'The line and area charts are very similar...only a small path generation '
		 + 'method separates the two.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @property
 		 */
 		me.lineChartButton = Ext.create('Ext.button.Button', {
 			text: '<b>[ Line Chart ]</b>',
 			iconCls: 'icon-line-chart',
 			handler: function(btn) {
	 			btn.setText('<b>[ Line Chart ]</b>');
	 			me.areaChartButton.setText('Area Chart');
	 			
	 			me.lineChart.setFillArea(false);
	 			me.lineChart.transition();
 			},
 			scope: me
 		});
 		
 		me.areaChartButton = Ext.create('Ext.button.Button', {
 			text: 'Area Chart',
 			iconCls: 'icon-area-chart',
 			handler: function(btn) {
	 			btn.setText('<b>[ Area Chart ]</b>');
	 			me.lineChartButton.setText('Line Chart');
	 			
	 			me.lineChart.setFillArea(true);
	 			me.lineChart.transition();
 			},
 			scope: me
 		});
		
		/**
 		 *@property
 		 */
 		me.tbar = [
	 		me.lineChartButton,
	 		'-',
	 		me.areaChartButton,
	 		'->',
	 	{
	 		xtype: 'button',
			text: 'Randomize',
			iconCls: 'icon-arrow-switch',
			tooltip: 'Make up some random data',
			handler: function() {
				me.lineChart.setGraphData(me.generateGraphData());
				me.lineChart.transition();
			},
			scope: me
		}, {
			xtype: 'tbspacer',
			width: 10
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
	 * @memberOf App.view.d3.scatterplot.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.getWidth() * .95),
 			me.canvasHeight = parseInt(me.getHeight() * .95),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 	
	 	// random graph data
	 	me.graphData = me.generateGraphData();
	 		
	 	// init chart
	 	me.lineChart = Ext.create('App.util.d3.LineChart', {
		 	svg: me.svg,
		 	canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			panelId: me.panelId,
			graphData: me.graphData,
			margins: {
				top: 40,
				right: 30,
				bottom: 60,
				left: 70
			},
			yScalePadding: 1,
			xDataMetric: me.defaultXDataMetric,
			yDataMetric: me.defaultYDataMetric,
			chartTitle: me.baseTitle,
			xTickFormat: function(d) {
				return Ext.util.Format.date(new Date(d), 'm/d/y');
			},
			yTickFormat: function(d) {
				return Ext.util.Format.currency(d);
			}
		});
		
		me.lineChart.draw();
	 },
	 
	 /**
 	  * @function
 	  * @description Random data generator
 	  */
	 generateGraphData: function() {
	 	var me = this,
	 		ret = [];
	 		
	 	var d = new Date(me.baseDate);
	 	d.setHours(0);
	 	d.setMinutes(0);
	 	d.setSeconds(0);
	 	
	 	var baseTimestamp = d.getTime(),
	 		currentPrice = 15,
	 		loopLimit = Math.ceil(Math.random() * 300);
		
		for(i=0; i<loopLimit; i++) {
		
			var temp = Math.random();
			if(temp < .5) {
				currentPrice = currentPrice - temp;
			} else {
				currentPrice = currentPrice + temp;
			}

			ret.push({
				timestamp: baseTimestamp + (86400000 * i),
				price: currentPrice
			});
		}
			
		return ret;
	 }
});