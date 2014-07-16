/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barlegend
 * @description Bar chart with legend
 */
Ext.define('App.view.d3.barlegend.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barlegendMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.BarChart',
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
 			me.barChart = null,
 			me.defaultMetric = 'gross',
 			me.defaultMetricText = 'Gross Box Office',
 			me.currentMetric = 'gross',
 			me.baseTitle = 'Box Office Statistics',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Bar Chart ++</b><br><br>'
			+ 'Label toggling and legend/legend transitions with mouseover events.<br><br>'
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
			text: 'Opening Wknd',
			handler: me.metricHandler,
			scope: me
		}, {
			xtype: 'button',
			iconCls: 'icon-star',
			metric: 'imdbRating',
			text: 'IMDB Rating',
			handler: me.metricHandler,
			scope: me
		},/* {
			xtype: 'tbspacer',
			width: 25
		}, {
			xtype: 'tbtext',
			text: '<b>Orientation:</b>'
		}, {
			xtype: 'button',
			tooltip: 'Vertical',
			iconCls: 'icon-bar-chart',
			handler: me.orientationHandler,
			scope: me
		}, 
			'-',
		{
			xtype: 'button',
			tooltip: 'Horizontal',
			iconCls: 'icon-bar-chart-hoz',
			handler: me.orientationHandler,
			scope: me
		},*/
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
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
	 	var me = this;
	 	
	 	me.getEl().mask('Drawing...');
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
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
	 			
	 			me.barChart = Ext.create('App.util.d3.final.BarChart', {
					svg: me.svg,
					canvasWidth: me.canvasWidth,
					canvasHeight: me.canvasHeight,
					graphData: me.graphData,
					dataMetric: me.defaultMetric,
					panelId: me.panelId,
					chartFlex: 4,
					legendFlex: 1,
					margins: {
						top: 25,
						right: 10,
						bottom: 40,
						left: 100,
						leftAxis: 85
					},
					showLabels: true,
					showLegend: true,
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
				
				
				me.barChart.draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
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
			if(button.metric) {
				if(button.metric == btn.metric) {
					button.addCls(me.btnHighlightCss);
				} else {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
		me.currentMetric = btn.metric;
		me.barChart.setChartTitle(me.generateChartTitle(btn.text));
		if(btn.metric == 'theaters') {
			me.barChart.setYTickFormat(App.util.Global.svg.numberTickFormat);
		} else if(btn.metric == 'imdbRating') {
			me.barChart.setYTickFormat(function(d) {
				return Ext.util.Format.number(d, '0.0');
			});
		} else {
			me.barChart.setYTickFormat(App.util.Global.svg.wholeDollarTickFormat);
		}
		me.barChart.setDataMetric(btn.metric);
		me.barChart.transition();
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
			me.barChart.setShowLabels(false);
		} else {
			btn.currentValue = 'on';
			btn.setText('ON');
			btn.addCls(me.btnHighlightCss);
			me.barChart.setShowLabels(true);
		}
		
		me.barChart.transition();
	},
	
	orientationHandler: function(btn) {
		return;
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
