/**
 * @class
 * @memberOf App.view.d3.bar
 * @description SVG panel
 * @extend Ext.panel.Panel
 */
Ext.define('App.view.d3.bar.VizPanel', {
	extend: 'Ext.panel.Panel',
	plain: true,
	autoScroll: true,
	collapsible: true,
	
	requires: [
		'App.util.JsonBuilder',
		'App.util.d3.BarChart',
		'App.store.movie.MovieMetricStore'
	],
	
	listeners: {
		afterrender: function(panel) {
			panel.getEl().mask('Drawing...');
			panel.initCanvas();
		}
	},
	
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
 			me.barChart = null,
 			me.defaultMetric = 'gross',
 			me.defaultMetricText = 'Gross Box Office',
 			me.currentMetric = 'gross',
 			me.baseTitle = 'Box Office Statistics',
 			me.eventRelay = Ext.create('App.util.MessageBus');
 			
 		/**
  		 * @property
  		 * @type Ext.toolbar.Toolbar
  		 */
  		me.tbar = [{
		  	xtype: 'button',
		  	iconCls: 'icon-dollar',
		  	metric: 'gross',
		  	text: me.defaultMetricText,
			handler: me.metricHandler,
			scope: me
		}, {
			xtype: 'button',
			iconCls: 'icon-film',
			metric: 'theaters',
			text: '# Theaters',
			handler: me.metricHandler,
			scope: me
		}, {
			xtype: 'button',
			iconCls: 'icon-dollar',
			metric: 'opening',
			text: 'Opening Weekend',
			handler: me.metricHandler,
			scope: me
		}, {
			xtype: 'button',
			iconCls: 'icon-star',
			metric: 'imdbRating',
			text: 'IMDB Rating',
			handler: me.metricHandler,
			scope: me
		}];
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.bar.VizPanel
	 * @description Toolbar button handler
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
		me.currentMetric = btn.metric;
		if(btn.metric == 'theaters') {
			me.barChart.setYTickFormat(App.util.Global.svg.numberTickFormat);
		} else if(btn.metric == 'imdbRating') {
			me.barChart.setYTickFormat(function(d) {
				return Ext.util.Format.number(d, '0.0');
			});
		} else {
			me.barChart.setYTickFormat(App.util.Global.svg.wholeDollarTickFormat);
		}
		me.barChart.setChartTitle(me.generateChartTitle(btn.text));
		me.barChart.transition(btn.metric);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.bar.VizPanel
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
	 		
	 	// load store and build chart
	 	me.dataStore.load({
	 		callback: function(records) {
	 		
		 		me.graphData = App.util.JsonBuilder.buildMovieDataJson(records);

		 		me.barChart = Ext.create('App.util.d3.BarChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					graphData: me.graphData,
					defaultMetric: 'gross',
					panelId: me.panelId,
					showLabels: true,
					labelFunction: function(data, index) {
						return data.title;
					},
					margins: {
						top: 20,
						right: 10,
						bottom: 10,
						left: 100,
						leftAxis: 85
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.title + '</b> (' + data.release+ ')<br>'
							+ 'Gross: ' + Ext.util.Format.currency(data.gross, false, '0', false) + '<br>'
							+ 'Theaters: ' + data.theaters + '<br>'
							+ 'Opening: ' + Ext.util.Format.currency(data.opening, false, '0', false) + '<br>'
							+ 'IMDB Rating: ' + data.imdbRating;
					},
					handleEvents: true,
					mouseOverEvents: {
						enabled: true,
						eventName: 'barGridPanelRowHighlight',
						eventDataMetric: 'title'
					},
					chartTitle: me.generateChartTitle(me.defaultMetricText),
					yTickFormat: App.util.Global.svg.wholeDollarTickFormat
				}, me);
				
				me.getEl().unmask();
				
				me.barChart.draw();
			},
			scope: me
		});
	},
	
	/** 
	 * @function
	 * @private
	 * @description Set a new chart title
	 */
	generateChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append;
	}
});
