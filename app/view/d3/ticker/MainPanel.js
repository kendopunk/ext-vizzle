/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.ticker.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.tickerMainPanel',
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
 			me.maxDatesToShow = 25,
 			me.defaultIncrement = 3000;	// 3s
 			me.baseTitle = 'Stock Price Ticker',
 			me.defaultXDataMetric = 'timestamp',
 			me.defaultYDataMetric = 'price',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
 		me.chartDescription = '<b>"Ticker"</b><br><br>'
	 		+ 'Uses Ext.TaskManager to update the chart data every 3 seconds';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt(Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight) - 10;
		
		/**
 		 * task manager button
 		 */
 		me.taskMgrButton = Ext.create('Ext.button.Button', {
	 		text: 'RUNNING',
	 		cls: me.btnHighlightCss,
	 		tooltip: 'Toggle ticker on/off',
	 		currentValue: 'on',
	 		handler: function(btn) {	
	 			if(btn.currentValue == 'on') {
	 				Ext.TaskManager.stop(me.chartUpdateTask);
	 				
	 				btn.removeCls(me.btnHighlightCss);
	 				btn.currentValue = 'off';
	 				btn.setText('STOPPED');
	 			} else {
	 				Ext.TaskManager.start(me.chartUpdateTask);
	 				
	 				btn.addCls(me.btnHighlightCss);
	 				btn.currentValue = 'on';
	 				btn.setText('RUNNING');
	 			}
	 		}
	 	});
	 	
		/**
 		 * chart update task
 		 */
 		me.chartUpdateTask = {
	 		run: function() {
		 		me.tickAdd();
		 	},
		 	interval: me.defaultIncrement,
		 	scope: me
		}
		
		Ext.TaskManager.start(me.chartUpdateTask);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Ticker:</b>'
			},
				me.taskMgrButton
			]
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
				return Ext.util.Format.date(new Date(d), 'H:i:s');
			},
			yTickFormat: function(d) {
				return Ext.util.Format.currency(d);
			},
			strokeColor: '#0000FF',
			fillArea: true,
			fillColor: '#DDDDDD',
			markerFillColor: 'red',
			markerStrokeColor: 'black',
			showLabels: true,
			labelSkipCount: 5,
			labelFunction: function(d, i) {
				return Ext.util.Format.currency(d.price, 0, false, 0);
			},
			tooltipFunction: function(d, i) {
				return '<b>' + Ext.util.Format.currency(d.price, 0, false, 0) + '</b>'
					+ '<br>'
					+ new Date(d.timestamp).toLocaleDateString();
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
	 		ret = [],
	 		d = new Date(),
	 		currentPrice = 7.5;
	 		
	 	var baseTimestamp = d.getTime();
	 	
		for(i=0; i<me.maxDatesToShow; i++) {
			var temp = Math.random();
			if(temp < .5) {
				currentPrice = currentPrice - temp;
			} else {
				currentPrice = currentPrice + temp;
			}

			ret.push({
				timestamp: baseTimestamp + (me.defaultIncrement * i),
				price: currentPrice
			});
		}
			
		return ret;
	 },
	 
	 /**
 	  * @function
 	  * @description Add a random tick (price) entry to the graph data array
 	  */
	 tickAdd: function() {
	 	var me = this;
	 	
	 	var newData = Array.slice(Ext.clone(me.graphData), 1, me.graphData.length);
	 	
	 	// append
	 	var lastTs = newData[newData.length-1].timestamp;
	 	var lastPrice = newData[newData.length-1].price;
	 	var temp = Math.random();
	 	if(temp < .6) {
		 	lastPrice = lastPrice - temp;
		} else {
			lastPrice = lastPrice + temp;
		}
		lastTs += me.defaultIncrement;
		newData.push({
			timestamp: lastTs,
			price: lastPrice
		});
	 
	 	// transition
	 	me.graphData = newData;
	 	me.lineChart.setGraphData(newData);
	 	me.lineChart.transition();
	},
});