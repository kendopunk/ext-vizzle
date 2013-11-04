/**
 * @class
 * @memberOf App.view.d3.barlegend
 * @description SVG panel
 * @extend Ext.panel.Panel
 */
Ext.define('App.view.d3.barlegend.VizPanel', {
	extend: 'Ext.panel.Panel',
	plain: true,
	autoScroll: true,
	collapsible: true,
	
	layout: 'fit',
	
	requires: [
		'App.util.JsonBuilder',
		'App.util.viz.BarChart',
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
 			me.currentMetric = 'gross';
 			
 		/**
 		 * @property
 		 * @memberOf App.view.d3.barlegend.VizPanel
 		 * @type Ext.form.field.ComboBox
 		 * @description Metric selection list
 		 */
 		me.metricCombo = Ext.create('Ext.form.field.ComboBox', {
 			store: Ext.create('App.store.movie.MovieMetricStore', {
 				autoLoad: true
 			}),
			value: 'gross',
			displayField: 'display',
			valueField: 'value',
			editable: false,
			triggerAction: 'all',
			queryMode: 'local',
			width: 225,
			listWidth: 225,
			listeners: {
				select: function(combo) {
					me.currentMetric = combo.getValue();
					me.transition(combo.getValue());
				},
				scope: me
			}
		});
 			
 		/**
  		 * @property
  		 * @type Ext.toolbar.Toolbar
  		 */
  		me.tbar = [{
	  		xtype: 'tbtext',
	  		text: 'Metric:'
	  	}, 
	  		me.metricCombo
	  	];
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.barlegend.VizPanel
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

		 		me.barChart = Ext.create('App.util.viz.BarChart', {
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
					}
				}, me);
				
				me.getEl().unmask();
				
				me.barChart.draw();
			},
			scope: me
		});
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.barlegend.VizPanel
	 * @param metric String
	 * @description Transition the bar chart to a new metric
	 */
	transition: function(metric) {
		var me = this;

		if(metric == null) { metric = 'gross'; }
		
		me.barChart.transition(metric);
	}
});
