/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.area
 * @description Configurable generic line chart
 */
Ext.define('App.view.d3.area.GenericLine', {
	extend: 'Ext.Panel',
	alias: 'widget.areaGeneric',
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
 			me.baseDate = '8/31/2013',
 			me.baseTitle = 'Random Price Data over Time',
 			me.defaultXDataMetric = 'timestamp',
 			me.defaultYDataMetric = 'price',
 			me.eventRelay = Ext.create('App.util.MessageBus')
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
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
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .98);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		////////////////////////////////////////
		// TOOLBAR/COMPONENTS
		////////////////////////////////////////
		me.lineChartButton = Ext.create('Ext.button.Button', {
 			text: 'Line Chart',
 			cls: me.btnHighlightCss,
 			iconCls: 'icon-line-chart',
 			handler: function(btn) {
	 			btn.addCls(me.btnHighlightCss);
 				me.areaChartButton.removeCls(me.btnHighlightCss);
 				
 				me.fillMenu.setDisabled(true);
	 			
	 			me.lineChart.setFillArea(false);
	 			me.lineChart.draw();
 			},
 			scope: me
 		});
 		me.areaChartButton = Ext.create('Ext.button.Button', {
 			text: 'Area Chart',
 			iconCls: 'icon-area-chart',
 			handler: function(btn) {
	 			btn.addCls(me.btnHighlightCss);
	 			me.lineChartButton.removeCls(me.btnHighlightCss);
	 			
	 			me.fillMenu.setDisabled(false);
	 			
	 			me.lineChart.setFillArea(true);
	 			me.lineChart.draw();
 			},
 			scope: me
 		});
 		me.fillMenu = Ext.create('Ext.menu.Item', {
			text: 'Fill',
			disabled: true,
			menu: {
				xtype: 'colormenu',
				listeners: {
			 		select: function(menu, color) {
			 			me.lineChart.setFillColor('#' + color);
			 			me.lineChart.draw();
			 		},
			 		scope: me
			 	}
			}
		});
		me.labelToggleButton = Ext.create('Ext.button.Button', {
			text: 'ON',
			currentValue: 'on',
			cls: me.btnHighlightCss,
			handler: function(btn) {
			 	if(btn.currentValue == 'on') {
				 	btn.currentValue = 'off';
				 	btn.setText('OFF');
				 	btn.removeCls(me.btnHighlightCss);
				 	
				 	me.lineChart.setShowLabels(false);
			 	} else {
				 	btn.currentValue = 'on';
				 	btn.setText('ON');
				 	btn.addCls(me.btnHighlightCss);
				 	
				 	me.lineChart.setShowLabels(true);
			 	}
			 	
			 	me.lineChart.draw();
			 },
			 scope: me
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'button',
				text: 'Randomize',
				iconCls: 'icon-arrow-switch',
				tooltip: 'Make up some random data',
				handler: function() {
					me.lineChart.setGraphData(me.generateGraphData());
					me.lineChart.draw();
				},
				scope: me
			},
			{xtype: 'tbspacer', width: 5},
			'-',
			{xtype: 'tbspacer', width: 5},
			{
				xtype: 'button',
				iconCls: 'icon-tools',
				text: 'Customize',
				menu: [{
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
		
		//////////////////////////////////////////////////
		// LISTENERS
		//////////////////////////////////////////////////
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
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
				top: 40,
				right: 30,
				bottom: 60,
				left: 70
			},
			yScalePadding: 1,
			xDataMetric: me.defaultXDataMetric,
			yDataMetric: me.defaultYDataMetric,
			chartTitle: me.baseTitle,
			markerFillColor: '#FF9900',
			xTickFormat: function(d) {
				return Ext.util.Format.date(new Date(d), 'm/d/y');
			},
			yTickFormat: function(d) {
				return Ext.util.Format.currency(d);
			},
			showLabels: true,
			labelSkipCount: 2,
			labelFunction: function(d, i) {
				return Ext.util.Format.currency(d.price, 0, false, 0);
			},
			tooltipFunction: function(d, i) {
				return '<b>' + Ext.util.Format.currency(d.price, 0, false, 0) + '</b>'
					+ '<br>'
					+ new Date(d.timestamp).toLocaleDateString();
			},
			markerRadius: 5
		});
		
		me.lineChart.initChart().draw();
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
	 		currentPrice = 4,
	 		minEl = 10,
	 		maxEl = 25,
	 		loopLimit = Math.floor(Math.random() * (maxEl - minEl + 1)) + minEl;
		
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