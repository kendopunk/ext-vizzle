/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barlegendlabellegend
 * @description Bar chart with legend
 */
Ext.define('App.view.d3.barlegendlabel.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barlegendlabelMainPanel',
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
 			me.barChart = null,
 			me.defaultMetric = 'gross',
 			me.defaultMetricText = 'Gross Box Office',
 			me.currentMetric = 'gross',
 			me.baseTitle = 'Box Office Statistics',
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Label Toggling</b><br><br>'
			+ 'Demonstration of toggling bar chart labels ON/OFF.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.labelOnButton = Ext.create('Ext.button.Button', {
			text: 'ON',
			iconCls: 'icon-tick',
			tooltip: 'Toggle chart labels ON',
			handler: function(btn) {
				btn.setIconCls('icon-tick');
				me.labelOffButton.setIconCls('');
				
				me.toggleLabels('on');
			},
			scope: me
		});
		
		me.labelOffButton = Ext.create('Ext.button.Button', {
			text: 'OFF',
			tooltip: 'Toggle chart labels OFF',
			handler: function(btn) {
				btn.setIconCls('icon-tick');
				me.labelOnButton.setIconCls('');
				
				me.toggleLabels('off');
			},
			scope: me
		});
 		
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
		}, 
			'->',
		{
			xtype: 'tbtext',
			text: '<b>Chart Labels</b>'
		},
			me.labelOnButton,
			'-',
			me.labelOffButton,
		{
			xtype: 'tbspacer',
			width: 25
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
	 * @memberOf App.view.d3.barlegendlabel.MainPanel
	 * @description Toolbar button handler
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
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
	 * @memberOf App.view.d3.barlegendlabel.MainPanel
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
	 			
	 			me.barChart = Ext.create('App.util.d3.BarLegendChart', {
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
	 * @private
	 * @description Set a new chart title
	 */
	generateChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append;
	},
	
	/**
 	 * @function
 	 * @description
 	 */
 	toggleLabels: function(status) {
	 	var me = this;

 		if(status == 'off') {
	 		me.barChart.setShowLabels(false);
	 	} else {
		 	me.barChart.setShowLabels(true);
		}
		me.barChart.transition();
 	}
});