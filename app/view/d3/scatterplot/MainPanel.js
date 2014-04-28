/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterplot
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
 			me.xDataMetric = 'bulletWeight',
 			me.defaultYDataMetric = 'muzzleVelocity',
 			me.yDataMetric = 'muzzleVelocity',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Simple Scatterplot</b><br><br>'
			+ 'Muzzle velocity, energy and price comparisons for 9mm, .40 S&W and .45 ACP<br><br>'
			+ 'This layout allows for independent control of X and Y axis metrics.<br><br>'
			+ 'Data from Wikipedia.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
		 * @property
		 * @description Tick formats
		 */
		me.velocityTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000') + ' fps';
		};
		me.energyTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000') + ' ft-lb';
		};
		me.weightTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000') + ' gr';
		};
		me.pprTickFormat = function(d) {
			return Ext.util.Format.currency(d);
		};
		
		/**
 		 * @property
 		 */
	 	me.scaleZeroButton = Ext.create('Ext.button.Button', {
	 		text: 'Absolute',
	 		cls: me.btnHighlightCss,
	 		handler: function(btn) {
		 		btn.addCls(me.btnHighlightCss);
		 		me.scaleMinMaxButton.removeCls(me.btnHighlightCss);

		 		me.scatterPlot.setScaleToZero(true);
		 		
		 		me.scatterPlot.transition();
		 	},
		 	scope: me
		 });
		 
		 me.scaleMinMaxButton = Ext.create('Ext.button.Button', {
	 		text: 'Range-Relative',
	 		handler: function(btn) {
		 		btn.addCls(me.btnHighlightCss);
		 		me.scaleZeroButton.removeCls(me.btnHighlightCss);
		 		
		 		me.scatterPlot.setScaleToZero(false);
		 		
		 		me.scatterPlot.transition();
		 	},
		 	scope: me
		 });
		 
		 me.markerLineToggleButton = Ext.create('Ext.button.Button', {
			 text: 'OFF',
			 currentValue: 'off',
			 handler: function(btn) {
			 	if(btn.currentValue == 'on') {
				 	btn.currentValue = 'off';
				 	btn.setText('OFF');
				 	btn.removeCls(me.btnHighlightCss);
				 	
				 	me.scatterPlot.setShowMarkerLines(false);
				 	me.scatterPlot.clearMarkerLines();
			 	} else {
				 	btn.currentValue = 'on';
				 	btn.setText('ON');
				 	btn.addCls(me.btnHighlightCss);
				 	
				 	me.scatterPlot.setShowMarkerLines(true);
				 	me.scatterPlot.handleMarkerLines();
			 	}
			 },
			 scope: me
		});

		/**
 		 * @property
 		 */
 		me.metricStore = Ext.create('Ext.data.SimpleStore', {
			 fields: ['display', 'value'],
			 data: [
			 	['Bullet Weight', 'bulletWeight'],
			 	['Muzzle Velocity', 'muzzleVelocity'],
			 	['Energy', 'energy'],
			 	['Price Per Rnd', 'ppr']
			]
		});
		
		/**
 		 * tbar
 		 */
 		me.tbar = [{
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
		 	value: 'muzzleVelocity',
		 	listeners: {
			 	select: function(combo) {
				 	me.scatterPlot.setYDataMetric(combo.getValue());
				 	me.yDataMetric = combo.getValue();
				 	
				 	if(combo.getValue() == 'muzzleVelocity') {
				 		me.scatterPlot.setYTickFormat(me.velocityTickFormat);
				 		me.scatterPlot.setYScalePadding(20);
				 	} else if(combo.getValue() == 'energy') {
				 		me.scatterPlot.setYTickFormat(me.energyTickFormat);
				 		me.scatterPlot.setYScalePadding(20);
				 	} else if(combo.getValue() == 'ppr') {
				 		me.scatterPlot.setYTickFormat(me.pprTickFormat);
				 		me.scatterPlot.setYScalePadding(.20);
				 	} else {
				 		me.scatterPlot.setYTickFormat(me.weightTickFormat);
				 		me.scatterPlot.setYScalePadding(20);
				 	}
				 	
				 	me.scatterPlot.setChartTitle(me.generateChartTitle(me.xDataMetric, me.yDataMetric));
				 	
				 	me.scatterPlot.transition();
			 	},
			 	scope: me
			}
		}, {
			xtype: 'tbspacer',
			width: 10
		}, {
	 		xtype: 'tbtext',
	 		text: '<b>X</b>'
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
		 	width: 140,
		 	listWidth: 140,
		 	value: 'bulletWeight',
		 	listeners: {
			 	select: function(combo) {
				 	me.scatterPlot.setXDataMetric(combo.getValue());
				 	me.xDataMetric = combo.getValue();
				 	
				 	if(combo.getValue() == 'muzzleVelocity') {
				 		me.scatterPlot.setXTickFormat(me.velocityTickFormat);
				 		me.scatterPlot.setXScalePadding(20);
				 	} else if(combo.getValue() == 'energy') {
				 		me.scatterPlot.setXTickFormat(me.energyTickFormat);
				 		me.scatterPlot.setXScalePadding(20);
				 	} else if(combo.getValue() == 'ppr') {
					 	me.scatterPlot.setXTickFormat(me.pprTickFormat);
					 	me.scatterPlot.setXScalePadding(.20);
					} else {
				 		me.scatterPlot.setXTickFormat(me.weightTickFormat);
				 		me.scatterPlot.setXScalePadding(20);
				 	}
				 	
				 	me.scatterPlot.setChartTitle(me.generateChartTitle(me.xDataMetric, me.yDataMetric));
				 	
				 	me.scatterPlot.transition();
			 	},
			 	scope: me
			}
		},
		'->',
		{
			xtype: 'tbtext',
			text: '<b>Guidelines:</b>'
		},
			me.markerLineToggleButton,
		{
			xtype: 'tbspacer',
			width: 10
		}, {
			xtype: 'tbtext',
			text: '<b>Scaling:</b>'
		}, 
			me.scaleZeroButton,
			me.scaleMinMaxButton,
			{xtype: 'tbspacer', width: 15}
		];
			
		
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
 			me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .98),
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
						top: 20,
						right: 20,
						bottom: 50,
						left: 75
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
					xTickFormat: me.weightTickFormat,
					yTickFormat: me.velocityTickFormat,
					tooltipFunction: function(data, index) {
						return '<b>' + data.cartridge + ' '
							+ data.bulletType + '</b><br>'
							+ 'Weight: ' + data.bulletWeight + 'gr<br>'
							+ 'Velocity: '
							+ Ext.util.Format.number(data.muzzleVelocity, '0,000')
							+ ' fps<br>'
							+ 'Energy: ' 
							+ Ext.util.Format.number(data.energy, '0,000') + ' ft-lb<br>'
							+ 'PPR: ' 
							+ Ext.util.Format.currency(data.ppr);
					},
					showLabels: true,
					labelFunction: function(data, index) {
						return data.cartridge + ' ' + data.bulletType;
					},
					showMarkerLines: false
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
			
			case 'ppr':
			ret = ret + 'PPR';
			break;
			
			default:
			ret = ret + 'Bullet Weight';
			break;
		}
		
		ret = ret + ' (Y) vs ';
		
		switch(xDataMetric) {
			case 'muzzleVelocity':
			ret = ret + 'Muzzle Velocity';
			break;
			
			case 'energy':
			ret = ret + 'Energy';
			break;
			
			case 'ppr':
			ret = ret + 'PPR';
			break;
			
			default:
			ret = ret + 'Bullet Weight';
			break;
		}
		
		ret = ret + ' (X)';
		
		return ret;
	}
});