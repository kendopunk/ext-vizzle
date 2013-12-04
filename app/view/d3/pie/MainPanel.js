/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
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
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Simple Pie Chart</b><br><br>'
			+ 'Top calibers in firearm recoveries, 2012.  Data from ATF.<br><br>'
			+ 'Convert the pie chart to a donut chart by using the <b>Inner Radius</b> options in the toolbar';
			
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
			cls: me.btnHighlightCss,
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
		'->',
		{xtype: 'tbtext', text: '<b>Inner Radius:</b>'},
		{
			xtype: 'button',
			text: '0%',
			innerPct: 0,
			cls: me.btnHighlightCss,
			handler: me.innerRadiusHandler,
			scope: me
		}, {
			xtype: 'button',
			text: '25%',
			innerPct: .25,
			handler: me.innerRadiusHandler,
			scope: me
		}, {
			xtype: 'button',
			text: '50%',
			innerPct: .50,
			handler: me.innerRadiusHandler,
			scope: me
		}, {
			xtype: 'button',
			text: '75%',
			innerPct: .75,
			handler: me.innerRadiusHandler,
			scope: me
		}, {
			xtype: 'button',
			text: '95%',
			innerPct: .95,
			handler: me.innerRadiusHandler,
			scope: me
		}, {
			xtype: 'tbspacer',
			width: 10
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
	 * @memberOf App.view.d3.pie.MainPanel
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
	 			me.pieChart = Ext.create('App.util.d3.PieChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					margins: {
						top: 40
					},
					graphData: me.atfData[0]['recoveries'],
					panelId: me.panelId,
					chartTitle: me.generateChartTitle('TX'),
					showLabels: true,
					labelFunction: function(data, index) {
						return data.data.caliber;
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.data.caliber + '</b><br>'
							+ Ext.util.Format.number(data.data.recovery, '0,000')
							+ ' recoveries';
					},
					dataMetric: 'recovery'
				}, me);
				
				// draw
				me.pieChart.draw();
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
	 	
	 	// remove the cls
	 	Ext.each(me.getDockedItems()[0].query('button'), function(btn) {
		 	if(btn.abbrev) {
			 	btn.removeCls(me.btnHighlightCss);
			}
		}, me);
		button.addCls(me.btnHighlightCss);
	 	
	 	// set chart title
	 	me.pieChart.setChartTitle(me.generateChartTitle(button.abbrev));
	 	
	 	// set data and transition
	 	me.pieChart.setGraphData(me.atfData[button.targetIndex]['recoveries']);
	 	me.pieChart.transition();
	 },

	/**
 	 * @function
 	 * @description Handle radius change buttons
 	 */
	innerRadiusHandler: function(button, event) {
	 	var me = this;
	 	
	 	// remove the cls
	 	Ext.each(me.getDockedItems()[0].query('button'), function(btn) {
		 	if(btn.innerPct >= 0) {
			 	btn.removeCls(me.btnHighlightCss);
			}
		}, me);
		button.addCls(me.btnHighlightCss);
	 	
	 	me.pieChart.setInnerRadius(parseInt(me.pieChart.outerRadius * button.innerPct));
	 	
	 	me.pieChart.transition();
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