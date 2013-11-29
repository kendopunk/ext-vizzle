/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barlegendlegend
 * @description Bar chart with legend
 */
Ext.define('App.view.d3.barlegend.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barlegendMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.BarLegendChart',
		'App.store.movie.MovieStore'
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
 			me.barLegendChart = null,
 			me.defaultMetric = 'gross',
 			me.defaultMetricText = 'Gross Box Office',
 			me.currentMetric = 'gross',
 			me.baseTitle = 'Box Office Statistics',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Bar Chart w/Legend</b><br><br>'
			+ 'Demonstration of a D3 bar chart with legend and label toggling.  This is a subclass of the generic bar chart.<br><br>'
			+ 'The chart and legend are each contained in separate SVG "g" elements and can be '
			+ '"flexed" accordingly to adjust the width each "g" occupies in the canvas.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
 		
		/**
		 * @property
		 * @type Ext.toolbar.Toolbar
		 */
		me.tbar = [{
		  	xtype: 'button',
		  	iconCls: 'icon-dollar',
		  	metric: 'gross',
		  	cls: me.btnHighlightCss,
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
		}, 
			'->',
		{
			xtype: 'tbtext',
			text: '<b>Labels:</b>'
		}, {
			xtype: 'button',
			text: 'ON',
			cls: me.btnHighlightCss,
			currentValue: 'on',
			handler: me.labelHandler,
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
	 * @memberOf App.view.d3.barlegend.MainPanel
	 * @description Toolbar button handler
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
		// button cls
		Ext.each(me.query('toolbar > button'), function(button) {
			if(button.metric == btn.metric) {
				button.addCls(me.btnHighlightCss);
			} else {
				button.removeCls(me.btnHighlightCss);
			}
		}, me);
		
		me.currentMetric = btn.metric;
		me.barLegendChart.setChartTitle(me.generateChartTitle(btn.text));
		if(btn.metric == 'theaters') {
			me.barLegendChart.setYTickFormat(App.util.Global.svg.numberTickFormat);
		} else if(btn.metric == 'imdbRating') {
			me.barLegendChart.setYTickFormat(function(d) {
				return Ext.util.Format.number(d, '0.0');
			});
		} else {
			me.barLegendChart.setYTickFormat(App.util.Global.svg.wholeDollarTickFormat);
		}
		me.barLegendChart.setDataMetric(btn.metric);
		me.barLegendChart.transition();
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
	 		url: 'data/movie_data.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			Ext.each(resp.data, function(rec) {
		 			me.graphData.push(rec);
		 		}, me);
	 			
	 			me.barLegendChart = Ext.create('App.util.d3.BarLegendChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					graphData: me.graphData,
					dataMetric: me.defaultMetric,
					panelId: me.panelId,
					chartFlex: 4,
					legendFlex: 1,
					margins: {
						top: 20,
						right: 10,
						bottom: 10,
						left: 100,
						leftAxis: 85
					},
					showLabels: true,
					labelFunction: function(data, index) {
						return data.title;
					},
					legendTextFunction: function(data, index) {
						return data.title + ' (' + data.release + ')';
					},
					tooltipFunction: function(data, index) {
						return '<b>' + data.title + '</b> (' + data.release+ ')<br>'
							+ 'Gross: ' + Ext.util.Format.currency(data.gross, false, '0', false) + '<br>'
							+ 'Theaters: ' + data.theaters + '<br>'
							+ 'Opening: ' + Ext.util.Format.currency(data.opening, false, '0', false) + '<br>'
							+ 'IMDB Rating: ' + data.imdbRating;
					},
					yTickFormat: App.util.Global.svg.wholeDollarTickFormat,
					chartTitle: me.generateChartTitle(me.defaultMetricText)
				}, me);
				
				
				me.barLegendChart.draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	 },
	 
	/** 
	 * @function
	 * @description Toggle labels on/off
	 */
	labelHandler: function(btn) {
	 	var me = this;
	 	
		if(btn.currentValue == 'on') {
			btn.currentValue = 'off';
			btn.setText('OFF');
			btn.removeCls(me.btnHighlightCss);
			me.barLegendChart.setShowLabels(false);
		} else {
			btn.currentValue = 'on';
			btn.setText('ON');
			btn.addCls(me.btnHighlightCss);
			me.barLegendChart.setShowLabels(true);
		}
		
		me.barLegendChart.transition();
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