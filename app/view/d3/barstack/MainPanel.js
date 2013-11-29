/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barstack
 * @description Stacked bar chart
 */
Ext.define('App.view.d3.barstack.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barstackMainPanel',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.StackedBarChart'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.workingGraphData = [],
 			me.originalGraphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.stackedBarChart = null,
 			me.currentMetric = 'sales',
 			me.defaultMetricText = 'By Total Sales',
 			me.baseTitle = 'Top Albums',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Stacked Bar Chart</b><br><br>'
			+ '<i>Sales of some of the top-selling albums of all time in the US, UK, and Canada. '
		 	+ 'Data from Wikipedia (for the most part)</i><br><br>'
			+ 'Demonstration of a D3 stacked bar chart using stack layout.<br><br>'
			+ 'Check out the mouseover events...'
			
		/**
		 * @property
		 * @description Message event relay
		 */
		me.eventRelay = Ext.create('App.util.MessageBus');
		me.eventRelay.subscribe('albumRemove', me.handleRemoveButton, me);
			
		/**
 		 * @properties
 		 * @description layout vars and tooltip functions
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * label functions
 		 */
 		me.salesLabelFn = function(data, index) {
	 		return Ext.util.Format.number(data.y, '0,000');
	 	};

		me.pctLabelFn = function(data, index) {
			return Ext.util.Format.number(data.y, '0.0') + '%';
		};
		
		/**
 		 * tooltip functions
 		 */
		me.salesTooltipFn = function(data, index) {
			return '<b>' + data.id + '</b><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0,000');
		};
		
		me.percentTooltipFn = function(data, index) {
			return '<b>' + data.id + '</b><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0.00') + '%';
		};
		
		/**
 		 * tick format functions
 		 */
 		me.salesTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000');
		};
		
		me.percentTickFormat = function(d) {
			return Ext.util.Format.number(d, '0') + '%';
		};
		
		/**
 		 * @listener
 		 * @description On activate, publish a new message to the "Info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		//////////////////////////////////////////////////
		// button configurations
		//////////////////////////////////////////////////
		me.albumRemoveButton = Ext.create('Ext.button.Button', {
			text: '',
			iconCls: 'icon-delete',
			targetIndex: null,
			hidden: true,
			disabled: true,
			handler: function(btn, e) {
				me.removeAlbum(btn.targetIndex);
				btn.disable().hide();
				me.albumRevertButton.enable().show();
				me.albumRevertButton.enable().show();
			},
			scope: me
		}, me);
		
		me.albumRevertButton = Ext.create('Ext.button.Button', {
			text: 'Revert Data',
			tooltip: 'Revert back to original data',
			iconCls: 'icon-refresh',
			handler: function(btn) {
				me.albumRevert();
			},
			scope: me,
			disabled: true
		}, me);
		
		/**
		 * @property
		 * @type Ext.toolbar.Toolbar
		 */
		me.tbar =[{
				xtype: 'button',
				text: 'By Total Sales',
				metric: 'sales',
				iconCls: 'icon-album',
				cls: me.btnHighlightCss,
				handler: me.metricHandler,
				scope: me
			}, {
				xtype: 'button',
				text: 'By Pct. Sales',
				metric: 'percent',
				iconCls: 'icon-percent',
				handler: me.metricHandler,
				scope: me
			},
			'->',
			me.albumRemoveButton,
			me.albumRevertButton
		];
		
		/**
 		 * @listener
 		 * @description After render, initialize the canvas
 		 */
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
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
			},
			tooltipFunction: me.salesTooltipFn,
			yTickFormat: me.salesTickFormat,
			chartTitle: me.generateChartTitle(me.defaultMetricText),
			handleEvents: true,
			mouseEvents: {
				mouseover: {
					enabled: true,
					eventName: 'albumRemove'
				}
			},
			showLabels: true,
			labelFunction: me.salesLabelFn
		});
		
		// retrieve the graph data via AJAX and load the visualization
		Ext.Ajax.request({
			url: 'data/album_sales.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			Ext.each(resp.data, function(rec) {
		 			me.workingGraphData.push(rec);
		 			me.originalGraphData.push(rec);
		 		}, me);
		 		
		 		me.stackedBarChart.setGraphData(me.workingGraphData);
		 		me.stackedBarChart.draw();
		 	},
		 	scope: me
		 });
 	},
 	
 	/**
  	 * @function
  	 * obj.payload, obj.index
  	 */
 	handleRemoveButton: function(obj) {
 		var me = this;
 		
 		me.albumRemoveButton.setText('Remove ' + obj.payload.artist);
 		me.albumRemoveButton.targetIndex = obj.index;
 		me.albumRemoveButton.enable().show();
 		
 		me.albumRevertButton.show();
 	},
 	
 	/**
  	 * @function
  	 * @memberOf App.view.d3.barstack.MainPanel
  	 * @description Remove a selected album
  	 */
  	removeAlbum: function(index) {
  		var me = this;
  		
  		var newData = Ext.clone(me.workingGraphData);
  		for(i=0; i<newData.length; i++) {
  			newData[i].values.splice(index, 1);
  		}
  		me.workingGraphData = newData;
  		
  		if(me.currentMetric == 'percent') {
	  		var temp = Ext.clone(me.workingGraphData);
	  		var dataSet = me.normalizePercent(temp);
  		
  			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.percentTooltipFn);
			me.stackedBarChart.setYTickFormat(me.percentTickFormat);
		} else {			
			me.stackedBarChart.setGraphData(me.workingGraphData);
			me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
			me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		}

  		me.stackedBarChart.transition();
  	},
  	
  	/**
   	 * @function
   	 * @description Revert back to original graphData values
   	 */
  	albumRevert: function() {
  		var me = this;
  		
  		me.workingGraphData = me.originalGraphData;
  		
  		me.stackedBarChart.setLabelFunction(me.salesLabelFn);
  		me.stackedBarChart.setGraphData(me.workingGraphData);
  		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
  		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
		
		me.albumRevertButton.disable();
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
		
		me.stackedBarChart.setChartTitle(me.generateChartTitle(btn.text));
		me.currentMetric = btn.metric;
		
		var dataSet = Ext.clone(me.workingGraphData);
		
		if(btn.metric == 'percent') {
			dataSet = me.normalizePercent(dataSet);
			
			me.stackedBarChart.setLabelFunction(me.pctLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.percentTooltipFn);
			me.stackedBarChart.setYTickFormat(me.percentTickFormat);
			
		} else {
			me.stackedBarChart.setLabelFunction(me.salesLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
			me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		}
		
		me.stackedBarChart.transition();
	},
  
   	/**
     * @function
     * @description Convert graph data to percent layout
     */
    normalizePercent: function(normalizedData) {
    	
    	var me = this;
    	
    	var idTotals = [],
			uniqueIds = [];
		
		// retrieve unique ID values from the first array
	  	Ext.each(normalizedData[0].values, function(obj) {
	  		uniqueIds.push(obj.id);
	  		idTotals.push(0);
	  	});
	  	
	  	// run through the data and sum up totals per ID
	  	for(var i=0; i<normalizedData.length; i++) {
		  	var plucked = Ext.pluck(normalizedData[i].values, 'y'),
		  		j = 0;
			
			plucked.map(function(el) {
				idTotals[j] += el;
				j++;
			});
		}
		
		// now, run through the normalized data again and calculate
		// percentage
		Ext.each(normalizedData, function(obj) {
			var ind = 0;
			
			Ext.each(obj.values, function(item) {
				item.y = (item.y/idTotals[ind] * 100);
				ind++;
			});
		});
		
		return normalizedData;
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
