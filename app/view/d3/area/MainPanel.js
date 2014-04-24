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
	 			me.lineChart.transition();
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
	 			me.lineChart.transition();
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
			 			me.lineChart.transition();
			 		},
			 		scope: me
			 	}
			}
		});
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				me.lineChartButton,
				'-',
				me.areaChartButton,
				'-',
				{
			 		xtype: 'button',
			 		text: 'Colors',
			 		menu: [{
				 		text: 'Stroke',
				 		menu: {
					 		xtype: 'colormenu',
					 		listeners: {
						 		select: function(menu, color) {
						 			me.lineChart.setStrokeColor('#' + color);
						 			me.lineChart.transition();
						 		},
						 		scope: me
						 	}
					 	}
					},
						me.fillMenu
					]
				},
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
 			me.canvasWidth = parseInt(me.getWidth() * .98),
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
	 		currentPrice = 4,
	 		minEl = 10,
	 		maxEl = 40,
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