/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.misc
 * @description Configurable, responsive timeline chart
 */
Ext.define('App.view.d3.misc.Timeline', {
	extend: 'Ext.Panel',
	alias: 'widget.timeline',
	title: 'Timeline',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalTimeline'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.rawData = null,
 			me.graphData = null,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.baseTitle = 'Timeline',
 			me.currentTeam = 'yankees',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Timeline</b><br><br>'
			+ 'Allows for multiple timeline entries per category (manager/coach)<br><br>'
			+ 'Coaching history from Wikipedia.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * toolbar
 		 */
 		me.dockedItems = [{
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'button',
		 		text: 'NY Yankees',
		 		metric: 'yankees',
				cls: me.btnHighlightCss,
				handler: me.teamHandler,
				scope: me
			}, 
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
		 		text: 'Cincinnati Bengals',
		 		metric: 'bengals',
				handler: me.teamHandler,
				scope: me
			}, 
			{xtype: 'tbspacer', width: 10},
			{
				xtype: 'button',
		 		text: 'San Antonio Spurs',
		 		metric: 'spurs',
				handler: me.teamHandler,
				scope: me
			}]
		}];
		
		/**
 		 * @listeners
 		 */
		me.on('afterrender', me.initCanvas, me);
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @description Initialize drawing canvas
	 */
	initCanvas: function(panel) {
		var me = this;
		
		panel.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
	 		me.canvasWidth = Math.floor(panel.body.dom.offsetWidth * .95),
	 		me.canvasHeight = Math.floor(panel.body.dom.offsetHeight * .95),
 			me.panelId = '#' + panel.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// initialize chart
	 	me.timeline = Ext.create('App.util.d3.UniversalTimeline', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			chartTitle: me.buildChartTitle(),
			colorDefinedInData: true,
			margins: {
				top: 40,
				right: 10,
				bottom: 40,
				left: 125,
				leftAxis: 120
			},
			xTickFormat: function(d) {
				return new Date(d).getFullYear();
			},
			tooltipFunction: function(d, i) {
				var a = d.datePair[0].getFullYear();
				var b = d.datePair[1].getFullYear();
				if(a === b) {
					return d.name + '<br>' + a;
				} else {
					return d.name + '<br>' + a + '-' + b;
				}
			}
		}, me);
		
		// get data
		Ext.Ajax.request({
	 		url: 'data/coaches.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			resp.yankees.reverse();
	 			resp.bengals.reverse();
	 			resp.spurs.reverse();
	 			
	 			me.rawData = resp;
	 			me.graphData = resp[me.currentTeam];
	 			
	 			me.timeline.setGraphData(me.graphData);
	 			me.timeline.initChart().draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.bar.VizPanel
	 * @description Toolbar button handler
	 */
	teamHandler: function(btn, evt) {
		var me = this;
		
		// button cls
		Ext.each(me.query('toolbar > button'), function(button) {
			if(btn.hasOwnProperty('metric')) {
				if(button.metric == btn.metric) {
					button.addCls(me.btnHighlightCss);
				} else {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
		me.currentTeam = btn.metric;
		
		me.timeline.setChartTitle(me.buildChartTitle());
		me.timeline.setGraphData(me.rawData[me.currentTeam]);
		me.timeline.draw();
	},
	
	buildChartTitle: function() {
		var me = this;
		
		if(me.currentTeam == 'bengals') {
			return 'Coaching History - Cincinnati Bengals, 1969-Present';
		} else if(me.currentTeam == 'spurs') {
			return 'Coaching History - San Antonio Spurs, 1967-Present';
		} else {
			return 'Manager Timeline - New York Yankees, 1975-Present';
		}
	}
});