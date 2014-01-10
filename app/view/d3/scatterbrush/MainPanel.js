/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterbrush
 * @description Scatterplot using brushes
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.scatterbrush.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.scatterBrushMainPanel',
	title: 'Scatterplot',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.Scatterplot'
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
 			me.baseTitle = 'IP Traffic from 3-4 PM', 
 			me.defaultXDataMetric = 'start',
 			me.xDataMetric = 'start',
 			me.defaultYDataMetric = 'bytes',
 			me.yDataMetric = 'bytes',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Using Brushes</b><br><br>';
		
		//////////////////////////////////////////////////
		// tick formats
		//////////////////////////////////////////////////
		me.timeTickFormat = function(data) {
			return Ext.util.Format.date(new Date(data), 'G:i');
		};
		me.numTickFormat = function(data) {
			return Ext.util.Format.number(data, '0,0');
		};
		me.durationTickFormat = function(data) {
			return Ext.util.Format.number(data, '0,0') + ' ms';
		};
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @property
 		 */
 		me.metricStore = Ext.create('Ext.data.SimpleStore', {
			 fields: ['display', 'value'],
			 data: [
			 	['Bytes', 'bytes'],
			 	['Packets', 'packets'],
			 	['Duration (ms)', 'duration']
			 ]
		});
		
		/**
 		 * dock
 		 */
 		me.dockedItems = [{
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbtext',
		 		text: '<b>Y</b>'
		 	}, {
			 	xtype: 'combo',
			 	name: 'yAxis',
			 	store: me.metricStore,
			 	displayField: 'display',
		 		valueField: 'value',
		 		editable: false,
			 	typeAhead: true,
			 	queryMode: 'local',
			 	triggerAction: 'all',
			 	width: 140,
			 	listWidth: 140,
			 	value: 'bytes',
		 		listeners: {
			 		select: function(combo) {
				 		me.scatterPlot.setYDataMetric(combo.getValue());
				 		me.yDataMetric = combo.getValue();
				 		
				 		if(combo.getValue() == 'duration') {
				 			me.scatterPlot.setYTickFormat(me.durationTickFormat);
				 		} else {
				 			me.scatterPlot.setYTickFormat(me.numTickFormat);
				 		}				 		
				 		
					 	me.scatterPlot.setChartTitle(me.generateChartTitle(me.xDataMetric, me.yDataMetric));
					 	
					 	me.scatterPlot.transition();
					},
					scope: me
				}
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
	 * @memberOf App.view.d3.scatterbrush.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Drawing...');
		
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
	 		
	 	// get the data via Ajax call
	 	Ext.Ajax.request({
	 		url: 'data/ip_data.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			me.graphData = resp.data;
	 			
	 			// init scatterplot
	 			me.scatterPlot = Ext.create('App.util.d3.Scatterplot', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					graphData: me.graphData,
					panelId: me.panelId,
					dataMetric: 'muzzleVelocity',
					xDataMetric: me.defaultXDataMetric,
					xScalePadding: 10000,
					xTickFormat: me.timeTickFormat,
					yDataMetric: me.defaultYDataMetric,
					yTickFormat: me.numTickFormat,
					yScalePadding: 10,
					radius: 3,
					colorScaleFunction: function(data, index) {
						return '#0000FF';
					},
					margins: {
						top: 60,
						right: 5,
						bottom: 75,
						left: 75
					},
					chartTitle: me.generateChartTitle(me.xDataMetric, me.yDataMetric),
					scaleToZero: false
				}, me);
				
				me.scatterPlot.draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	 },
	 
	 /**
	 * @function
	 * @memberOf App.view.d3.scatterbrush.MainPanel
	 * @description Build a new chart title
	 */
	generateChartTitle: function(xDataMetric, yDataMetric) {
		var me = this;
		
		var ret = me.baseTitle + ' : ';
		
		switch(yDataMetric) {
			case 'duration':
			ret = ret + 'Duration (ms)';
			break;
			
			case 'packets':
			ret = ret + 'Packets';
			break;
			
			default:
			ret = ret + 'Bytes';
			break;
		}
		
		return ret;
	}
});