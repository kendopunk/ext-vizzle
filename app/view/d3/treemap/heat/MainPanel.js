/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterplot
 * @description Simple treemap panel with two independent metrics
 */
Ext.define('App.view.d3.treemap.heat.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.treemapHeatMainPanel',
	title: 'Heat Treemap',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.TreeMap'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.graphData = [],
	 		me.treemap = null,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.panelId,
 			me.sizeMetric = 'bytes',
 			me.colorMetric = 'packets',
 			me.baseTitle = 'IP Traffic',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Heat Treemap</b><br><br>'
		+ '<i>Treemap representation of sIP-to-dIP traffic in two different metrics simultaneously.</i><br><br>'
		+ 'Magnitude of bytes, packets or duration can be expressed as size and/or color.<br><br>'
		+ 'Base unidirectional NetFlow data  from Carnegie Mellon/SEI <a href="https://tools.netsa.cert.org/silk/referencedata.html">CERT NetSA</a> site...modified slightly to enhance transitions.'

		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * size combo store
 		 */
 		me.sizeStore = Ext.create('Ext.data.SimpleStore', {
			fields: ['display', 'value'],
			data: [
				['Bytes', 'bytes'],
				['Packets', 'packets'],
				['Duration', 'duration']
			]
		});
		
		/**
 		 * temperature combo store
 		 */
 		me.temperatureStore = Ext.create('Ext.data.SimpleStore', {
			fields: ['display', 'value'],
			data: [
				['Bytes', 'bytes'],
				['Packets', 'packets'],
				['Duration', 'duration']
			]
		});
		
		me.ipTextFunction = function(d, i) {
			return App.util.GridRenderers.longToIp(d.sip) 
				+ ' - '
				+ App.util.GridRenderers.longToIp(d.dip);
		};
		
		/**
 		 * top toolbar
 		 */
 		me.dockedItems = {
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbtext',
		 		text: '<b>Size:</b>'
		 	}, {
			 	xtype: 'combo',
			 	name: 'size',
			 	store: me.sizeStore,
			 	displayField: 'display',
			 	valueField: 'value',
			 	editable: false,
			 	typeAhead: true,
			 	queryMode: 'local',
			 	triggerAction: 'all',
			 	width: 130,
			 	listWidth: 130,
			 	value: 'bytes',
			 	listeners: {
				 	select: function(combo) {
					 	me.treemap.setSizeMetric(combo.getValue());
					 	me.treemap.transition();
				 	},
				 	scope: me
				 }
			}, {
				xtype: 'tbspacer',
				width: 10
			}, {
		 		xtype: 'tbtext',
		 		text: '<b>Temperature:</b>'
		 	}, {
			 	xtype: 'combo',
			 	name: 'temperature',
			 	store: me.temperatureStore,
			 	displayField: 'display',
			 	valueField: 'value',
			 	editable: false,
			 	typeAhead: true,
			 	queryMode: 'local',
			 	triggerAction: 'all',
			 	width: 130,
			 	listWidth: 130,
			 	value: 'packets',
			 	listeners: {
				 	select: function(combo) {
					 	me.treemap.setColorMetric(combo.getValue());
					 	me.treemap.transition();
				 	},
				 	scope: me
				 }
			}]
	 	};
		
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
	 * @memberOf App.view.d3.treemap.heat.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.canvasWidth = parseInt(me.getWidth() * .95),
 			me.canvasHeight = parseInt(me.getHeight() * .85) - 35,
 			me.panelId = '#' + me.body.id;
 			
	 	Ext.Ajax.request({
		 	url: 'data/ip_data.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				
				me.graphData = resp;

	 			me.treemap = Ext.create('App.util.d3.final.TreeMap', {
	 				panelId: me.panelId,
	 				canvasWidth: me.canvasWidth,
	 				canvasHeight: me.canvasHeight,
	 				graphData: resp,
	 				chartTitle: 'IP Traffic Heat Treemap',
	 				sizeMetric: me.sizeMetric,
	 				colorMetric: me.colorMetric,
	 				textFunction: me.ipTextFunction,
	 				sticky: true,
	 				fixedColorRange: ['#90EE90', '#FF0000'],
	 				mode: 'slice'
	 			});
				
				me.treemap.draw();
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	}
});