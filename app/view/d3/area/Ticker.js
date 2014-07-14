/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.area
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.area.Ticker', {
	extend: 'Ext.Panel',
	alias: 'widget.areaTicker',
	title: 'Line/Area Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalLine'
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
		
		var interpolateSchemes = Ext.Array.map([
			{
				name: 'Linear',
				id: 'linear'
			}, {
				name: 'Step Before',
				id: 'step-before'
			}, {
				name: 'Step After',
				id: 'step-after'
			}, {
				name: 'Basis',
				id: 'basis'
			}, {
				name: 'Monotone',
				id: 'monotone'
			}], function(item) {
				return {
					text: item.name,
					handler: function() {
						me.lineChart.setInterpolation(item.id);
						me.lineChart.draw();
					},
					scope: me
				};
			}
		);	
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Ticker:</b>'
			},
			me.taskMgrButton,
			{xtype: 'tbspacer', width: 5},
			'-',
			{xtype: 'tbspacer', width: 5},
			{
				xtype: 'button',
				iconCls: 'icon-tools',
				text: 'Customize',
				menu: [{
					text: 'Line Interpolation',
					menu: interpolateSchemes
				}, {
					xtype: 'menucheckitem',
					text: 'Grid',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.lineChart.setShowGrid(checked);
							me.lineChart.draw();
						},
						scope: me
					}
				}, {
					xtype: 'menucheckitem',
					text: 'Labels',
					checked: true,
					listeners: {
						checkchange: function(cbx, checked) {
							me.lineChart.setShowLabels(checked);
							me.lineChart.draw();
						},
						scope: me
					}
				}, {
					text: 'Label Skip',
					menu: [{
				 		text: 'No Skip',
				 		handler: function() {
					 		me.lineChart.setLabelSkipCount(1);
					 		me.lineChart.draw();
					 	},
					 	scope: me
				 	}, {
					 	text: '2',
				 		handler: function() {
					 		me.lineChart.setLabelSkipCount(2);
					 		me.lineChart.draw();
					 	},
					 	scope: me
					}, {
						text: '3',
				 		handler: function() {
					 		me.lineChart.setLabelSkipCount(3);
					 		me.lineChart.draw();
					 	},
					 	scope: me
					}]
				}]
			},
			{xtype: 'tbspacer', width: 5},
			'-',
			{xtype: 'tbspacer', width: 5},
			{
			 	xtype: 'button',
			 	iconCls: 'icon-color-wheel',
			 	text: 'Colors',
			 	menu: [{
				 	text: 'Circles',
				 	iconCls: 'icon-color-wheel',
				 	menu: {
					 	xtype: 'colormenu',
					 	listeners: {
						 	select: function(menu, color) {
						 		me.lineChart.setMarkerFillColor('#' + color);
						 		me.lineChart.draw();
						 	},
						 	scope: me
						 }
					 }
				}, {
				 	text: 'Line',
				 	iconCls: 'icon-color-wheel',
				 	menu: {
					 	xtype: 'colormenu',
					 	listeners: {
						 	select: function(menu, color) {
						 		me.lineChart.setStrokeColor('#' + color);
						 		me.lineChart.draw();
						 	},
						 	scope: me
						 }
					 }
				}, {
				 	text: 'Fill',
				 	iconCls: 'icon-color-wheel',
				 	menu: {
					 	xtype: 'colormenu',
					 	listeners: {
						 	select: function(menu, color) {
							 	if(color === 'FFFFFF') {
							 		me.lineChart.setFillArea(false);
							 	} else {
							 		me.lineChart.setFillArea(true);
						 			me.lineChart.setFillColor('#' + color);
						 		}
						 		me.lineChart.draw();
						 	},
						 	scope: me
						 }
					 }
				}]
			}]
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
	 * @memberOf App.view.d3.area.Ticker
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 	
	 	// random graph data
	 	me.graphData = me.generateGraphData();
	 		
	 	// init chart
	 	me.lineChart = Ext.create('App.util.d3.UniversalLine', {
		 	svg: me.svg,
		 	canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			panelId: me.panelId,
			graphData: me.graphData,
			margins: {
				top: 30,
				right: 30,
				bottom: 40,
				left: 70
			},
			xDataMetric: me.defaultXDataMetric,
			yDataMetric: me.defaultYDataMetric,
			chartTitle: me.baseTitle,
			xTickFormat: function(d) {
				return Ext.util.Format.date(new Date(d), 'H:i:s');
			},
			xScalePadding: .1,
			yTickFormat: function(d) {
				return Ext.util.Format.currency(d);
			},
			yScalePadding: .1,
			strokeColor: '#0000FF',
			fillArea: true,
			fillColor: '#DDDDDD',
			markerFillColor: 'red',
			markerStrokeColor: 'black',
			showLabels: true,
			labelFunction: function(d, i) {
				return Ext.util.Format.currency(d.price, 0, false, 0);
			},
			tooltipFunction: function(d, i) {
				return '<b>' + Ext.util.Format.currency(d.price, 0, false, 0) + '</b>'
					+ '<br>'
					+ new Date(d.timestamp).toLocaleDateString();
			}
		});
		
		me.lineChart.initChart().draw();
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
	 	
	 	var newData = Ext.Array.slice(Ext.clone(me.graphData), 1, me.graphData.length);
	 	
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
	 	me.lineChart.draw();
	},
});