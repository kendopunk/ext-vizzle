/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.scatterplot.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.scatterMainPanel',
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
 			me.baseTitle = '9/40/45 Ballistics',
 			me.defaultXDataMetric = 'bulletWeight',
 			me.defaultYDataMetric = 'muzzleVelocity',
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Simple Scatterplot</b><br><br>'
			+ 'Muzzle velocity and energy comparisons for 9mm, .40 S&W and .45 ACP<br><br>'
			+ 'Data from Wikipedia.';
			
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
			 	['Bullet Weight', 'bulletWeight'],
				 ['Muzzle Velocity', 'muzzleVelocity'],
				 ['Energy', 'energy']
			]
		});
		
		/**
 		 * tbar
 		 */
 		me.tbar = [{
	 		xtype: 'tbtext',
	 		text: 'Y Axis:'
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
		 	width: 150,
		 	listWidth: 150,
		 	value: 'muzzleVelocity',
		 	listeners: {
			 	select: function(combo) {
				 	me.scatterPlot.setYDataMetric(combo.getValue());
				 	me.scatterPlot.transition();
			 	},
			 	scope: me
			}
		}, {
			xtype: 'tbspacer',
			width: 10
		}, {
	 		xtype: 'tbtext',
	 		text: 'X Axis:'
	 	}, {
		 	xtype: 'combo',
		 	name: 'xAxis',
		 	store: me.metricStore,
		 	displayField: 'display',
	 		valueField: 'value',
	 		editable: false,
		 	typeAhead: true,
		 	queryMode: 'local',
		 	triggerAction: 'all',
		 	width: 150,
		 	listWidth: 150,
		 	value: 'bulletWeight',
		 	listeners: {
			 	select: function(combo) {
				 	me.scatterPlot.setXDataMetric(combo.getValue());
				 	me.scatterPlot.transition();
			 	},
			 	scope: me
			}
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
	 		url: 'data/ballistics.json',
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
					yDataMetric: me.defaultYDataMetric,
					xScalePadding: 50,
					yScalePadding: 50,
					radius: 8,
					margins: {
						top: 60,
						right: 0,
						bottom: 50,
						left: 100
					},
					colorScaleFunction: function(data, index) {
						if(data.cartridge == '.45 ACP') {
							return '#CC3300';
						} else if(data.cartridge == '.40 S&W') {
							return '#0000FF';
						} else {
							return '#33CC00';
						}
					},
					chartTitle: me.generateChartTitle(me.defaultXDataMetric, me.defaultYDataMetric),
					xTickFormat: function(d, i) {
						return Ext.util.Format.number(d, '0,000') + ' gr';
					},
					yTickFormat: function(d, i) {
						return Ext.util.Format.number(d, '0,000') + ' fps';
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.cartridge + ' '
							+ data.bulletType + '</b><br><br>'
							+ 'Weight: ' + data.bulletWeight + 'gr<br>'
							+ 'Velocity: '
							+ Ext.util.Format.number(data.muzzleVelocity, '0,000')
							+ ' fps<br>'
							+ 'Energy: ' 
							+ Ext.util.Format.number(data.energy, '0,000') + ' ft-lb.';
					},
					showLabels: true,
					labelFunction: function(data, index) {
						return data.cartridge + ' ' + data.bulletType;
					}
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
	 * @memberOf App.view.d3.scatterplot.MainPanel
	 * @description Build a new chart title
	 */
	generateChartTitle: function(xDataMetric, yDataMetric) {
		var me = this;
		
		var ret = me.baseTitle + ' : ';
		
		switch(yDataMetric) {
			case 'muzzleVelocity':
			ret = ret + 'Muzzle Velocity';
			break;
			
			case 'energy':
			ret = ret + 'Energy';
			break;
			
			default:
			ret = ret + 'Bullet Weight';
			break;
		}
		
		ret = ret + ' (Y) vs';
		
		switch(xDataMetric) {
			case 'muzzleVelocity':
			ret = ret + 'Muzzle Velocity';
			break;
			
			case 'energy':
			ret = ret + 'Energy';
			break;
			
			default:
			ret = ret + 'Bullet Weight';
			break;
		}
		
		ret = ret + ' (X)';
		
		return ret;
	}
});