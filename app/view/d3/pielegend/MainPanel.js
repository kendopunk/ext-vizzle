/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pielegend
 * @description Extended pie chart with legend
 */
Ext.define('App.view.d3.pielegend.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.pielegendMainPanel',
	title: 'Pie Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.PieLegendChart'
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
		me.chartDescription = '<b>Pie Chart with Legend</b><br><br>'
		 	+ 'Arc labels turned off...mouse over legend elements to highlight arcs.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.tbar = [{
			xtype: 'tbtext',
			text: '<b>State:</b>'
		}, {
			xtype: 'button',
			text: 'Texas',
			abbrev: 'TX',
			targetIndex: 0,
			handler: me.handleStateSelection,
			scope: me
		},
			'-',
		{
			xtype: 'button',
			text: 'New York',
			abbrev: 'NY',
			targetIndex: 1,
			handler: me.handleStateSelection,
			scope: me
		},
			'-',
		{
			xtype: 'button',
			text: 'Arkansas',
			abbrev: 'AR',
			targetIndex: 2,
			handler: me.handleStateSelection,
			scope: me
		},
			'-',
		{
			xtype: 'button',
			text: 'Georgia',
			abbrev: 'GA',
			targetIndex: 3,
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
	 * @memberOf App.view.d3.pielegend.MainPanel
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
	 			
	 			// init pie chart
	 			me.pieLegendChart = Ext.create('App.util.d3.PieLegendChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					margins: {
						top: 40
					},
					graphData: me.atfData[0]['recoveries'],
					panelId: me.panelId,
					chartTitle: me.generateChartTitle('TX'),
					showLabels: false,
					tooltipFunction: function(data, index) {
						return '<b>' + data.data.caliber + '</b><br>'
							+ Ext.util.Format.number(data.data.recovery, '0,000')
							+ ' recoveries';
					},
					dataMetric: 'recovery',
					chartFlex: 4,
					legendFlex: 1,
					legendTextFunction: function(data, index) {
						return data.caliber + ' ('
							+ Ext.util.Format.number(data.recovery, '0,000')
							+ ')';
					}
				}, me);
				
				// draw
				me.pieLegendChart.draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	 },
	 
	 /**
	  * @function
	  * @memberOf App.util.d3.pie
	  * @description Handle state selection button click
	  */
	 handleStateSelection: function(button, event) {
	 	var me = this;
	 	
	 	// set chart title
	 	me.pieLegendChart.setChartTitle(me.generateChartTitle(button.abbrev));
	 	
	 	// set data and transition
	 	me.pieLegendChart.setGraphData(me.atfData[button.targetIndex]['recoveries']);
	 	me.pieLegendChart.transition();
	 },
	 
	/**
	 * @function
	 * @memberOf App.util.d3.pie
	 * @description Build a new chart title
	 */
	generateChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append + ' Recoveries';
	}
});