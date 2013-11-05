/**
 * @class
 * @memberOf App.view.d3.barstack
 * @description Stacked bar chart
 */
Ext.define('App.view.d3.barstack.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barstackMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus'//,
		//'App.util.d3.StackedBarChart'
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
 			me.g,
 			me.panelId,
 			me.stackedBarChart = null,
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Stacked Bar Chart</b><br><br>'
			+ 'Demonstration of a D3 stacked bar chart using stack layout.';
			
		/**
		 * @property
		 * @description Message event relay
		 */
		me.eventRelay = Ext.create('App.util.MessageBus');
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @listener
 		 * @description On activate, publish a new message to the "Info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		/**
 		 * @listener
 		 * @description After render, initialize the canvas
 		 */
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.tbar =[{
			xtype: 'button',
			text: 'transition',
			handler: function() {
				me.transition();
			},
			scope: me
		}];
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.barstack.MainPanel
 	 * @description Initialize the drawing canvas
 	 */
 	initCanvas: function() {
 	
 		var me = this;
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.getWidth() * .95),
 			me.canvasHeight = parseInt(me.getHeight() * .95) - 35,
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.StackedBarChart', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			panelId: me.panelId,
			margins: {
				top: 40,
				right: 5,
				bottom: 20,
				left: 80
			}
		});
		
		// graph data
 		var test = [{
			category: 'Domestic',
			values: [
				{id: 'Van Halen', category: 'Domestic', y: 10},
				{id: 'ACDC', category: 'Domestic',  y: 10},
				{id: 'Rush', category: 'Domestic',  y: 10},
				{id: 'Steel Dragon', category: 'Domestic',  y: 10}
			]
		}, {
			category: 'Worldwide',
			values: [
				{id: 'Van Halen', category: 'Worldwide',  y: 10},
				{id: 'ACDC', category: 'Worldwide',  y: 10},
				{id: 'Rush', category: 'Worldwide',  y: 10},
				{id: 'Steel Dragon', category: 'Worldwide',  y: 10}
			]
		}, {
			category: 'Universal',
			values: [
				{id: 'Van Halen', category: 'Universal',  y: 10},
				{id: 'ACDC', category: 'Universal',  y: 10},
				{id: 'Rush', category: 'Universal',  y: 10},
				{id: 'Steel Dragon', category: 'Universal',  y: 10}
			]
		}];
		
		me.stackedBarChart.setGraphData(test);
		me.stackedBarChart.draw();
 	},
 	
 	transition: function() {
	 	var me = this;

 		var temp = [{
			category: 'Domestic',
			values: [
				{id: 'Van Halen', category: 'Domestic', y: 102},
				{id: 'ACDC', category: 'Domestic',  y: 110},
				{id: 'Rush', category: 'Domestic',  y: 103},
				{id: 'Steel Dragon', category: 'Domestic',  y: 410}
			]
		}, {
			category: 'Worldwide',
			values: [
				{id: 'Van Halen', category: 'Worldwide',  y: 510},
				{id: 'ACDC', category: 'Worldwide',  y: 170},
				{id: 'Rush', category: 'Worldwide',  y: 150},
				{id: 'Steel Dragon', category: 'Worldwide',  y: 710}
			]
		}, {
			category: 'Universal',
			values: [
				{id: 'Van Halen', category: 'Universal',  y: 910},
				{id: 'ACDC', category: 'Universal',  y: 102},
				{id: 'Rush', category: 'Universal',  y: 44},
				{id: 'Steel Dragon', category: 'Universal',  y: 234}
			]
		}];
		
		me.stackedBarChart.setGraphData(temp);
		me.stackedBarChart.transition();
 	
 	
 	}
});