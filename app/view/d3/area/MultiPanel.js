/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Multiple series line chart
 */
Ext.define('App.view.d3.area.MultiPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.areaMultiPanel',
	title: 'Multiline Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.MultiLineChart'
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
 			me.baseTitle = 'Multiline Chart: Random Price Data over Time',
 			me.defaultXDataMetric = 'month',
 			me.defaultYDataMetric = 'price',
 			me.eventRelay = Ext.create('App.util.MessageBus')
 			me.btnHighlightCss = 'btn-highlight-peachpuff',
 			me.randomizeLimit = false;
 			
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Multiline Chart</b><br><br>'
			+ '<i>Why add all your series at once, when you can do it as needed?</i><br><br>'
		 	+ 'Click "Add Random Series" for new line/series.<br><br>'
		 	+ 'This class keeps track of the min/max X and Y values so the scales will adjust '
		 	+ 'accordingly when higher/longer paths are added.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .98);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		////////////////////////////////////////
		// TOOLBAR/COMPONENTS
		////////////////////////////////////////
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'button',
				iconCls: 'icon-line-chart',
				text: 'Add Random Series',
				handler: function() {
					me.lineChart.appendSeries(me.generateGraphData(me.randomizeLimit));
					me.randomizeLimit = true;
				},
				scope: me
			},
			'-',
			{
				xtype: 'button',
				iconCls: 'icon-eraser',
				text: 'Clear All',
				handler: function() {					
					me.randomizeLimit = false;
					me.lineChart.clearSeries();
				},
				scope: me
			}]
		}];
		
		//////////////////////////////////////////////////
		// LISTENERS
		//////////////////////////////////////////////////
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		me.on('afterrender', function(panel) { me.initCanvas();}, me);
		
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
	 		
	 	// init chart
	 	me.lineChart = Ext.create('App.util.d3.final.MultiLineChart', {
		 	svg: me.svg,
		 	canvasWidth: me.canvasWidth,
		 	canvasHeight: me.canvasHeight,
		 	panelId: me.panelId,
		 	margins: {
				top: 40,
				right: 30,
				bottom: 60,
				left: 70
			},
	 		xDataMetric: me.defaultXDataMetric,
			yDataMetric: me.defaultYDataMetric,
			chartTitle: 'Multiple Series Chart',
			xTicks: 12,
			xTickFormat: function(d, i) {
				var dt = new Date(0, d-1);
				return Ext.util.Format.date(dt, 'M');
			},
			yTickFormat: function(d, i) {
				return Ext.util.Format.currency(d, '$', false, false);
			},
			fillColor: '#FFCC33',
			markerRadius: 3
		});
		
		me.lineChart.appendSeries(me.generateGraphData(me.randomizeLimit));
		me.randomizeLimit = true;
	 },
	 
	 /**
 	  * @function
 	  * @description Random data generator
 	  * @param randomizeLimit boolean
 	  */
	 generateGraphData: function(randomizeLimit) {
		var me = this,
			ret = [],
			currentPrice = Math.floor(Math.random() * 30),
			limit = 12,
			minMonth = 12,
			maxMonth = 24;		// 2 years
			
		if(randomizeLimit) {
			limit = Math.floor(Math.random() * (maxMonth-minMonth + 1) + minMonth);
		}
			 
		for(i=1; i<=limit; i++) {
			var temp = Math.random();
			if(temp < .5) {
				currentPrice = currentPrice - temp;
			} else {
				currentPrice = currentPrice + temp;
			}
			
			ret.push({
				month: i,
				price: currentPrice
			});
		}
		
		return ret;
	}
});