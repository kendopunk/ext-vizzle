/**
 * @class
 * @memberOf App.view.d3.pie
 * @description Simple pie chart panel
 */
Ext.define('App.view.d3.pie.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.pieMainPanel',
	title: 'Pie Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.PieChart'
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
 			me.baseTitle = 'Top Calibers Reported on 2012 Firearm Traces',
 			me.availableStates = [],
 			me.atfData = null,
 			me.defaultMetric = 'recovery',
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Simple Pie Chart</b><br><br>'
			+ 'Top calibers in firearm recoveries, 2012.  Data from ATF.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.tbar = [{
			xtype: 'button',
			text: 'Texas',
			abbrev: 'TX',
			targetIndex: 0,
			handler: me.handleStateSelection,
			scope: me
		}, {
			xtype: 'button',
			text: 'New York',
			abbrev: 'NY',
			targetIndex: 1,
			handler: me.handleStateSelection,
			scope: me
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
	 * @memberOf App.view.d3.barlegend.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
	 	var me = this;
	 	
	 	me.getEl().mask('Drawing...');
	 	
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
	 		
	 	// get the data via Ajax call
	 	Ext.Ajax.request({
	 		url: 'data/atf_trace_data.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			// unique states
	 			Ext.each(resp.data, function(rec) {
		 			me.availableStates.push(rec.state);
		 		}, me);
		 		
		 		// all the data 
		 		me.atfData = resp.data;
		 		
		 		console.debug(me.atfData[0]);
	 			
	 			// init pie chart
	 			me.pieChart = Ext.create('App.util.d3.PieChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					margins: {
						top: 30
					},
					graphData: me.atfData[0]['recoveries'],
					panelId: me.panelId,
					chartTitle: me.generateChartTitle('TX'),
					labelFunction: function(data, index) {
						return data.data.caliber;
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.data.caliber + '</b><br>'
							+ Ext.util.Format.number(data.data.recovery, '0,000')
							+ ' recoveries';
					}
				}, me);
				
				// draw
				me.pieChart.draw('recovery');
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	 },
	 
	 handleStateSelection: function(button, event) {
	 	
	 	var me = this;
	 	
	 	me.pieChart.setGraphData(me.atfData[button.targetIndex]['recoveries']);
	 	
	 	me.pieChart.transition('recovery');
	 	
	 	
	 	
	 },
	 
	 generateChartTitle: function(append) {
	 	var me = this;
	 	
	 	return me.baseTitle + ' : ' + append + ' Recoveries';
	 }
});