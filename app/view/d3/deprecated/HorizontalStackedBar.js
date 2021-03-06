/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barstack
 * @description Stacked bar chart
 */
Ext.define('App.view.d3.hozbarstack.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.hozBarStackMainPanel',
	title: 'Bar Chart',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.StackedBarChart'
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
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.stackedBarChart = null,
 			me.currentMetric = 'total',
 			me.baseTitle = 'German Tank Production in WWII (1939-1944)',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Stacked Bar Orientation</b><br><br>'
			+ '<i>horizontal / vertical toggling...</i><br><br>'
			+ 'Took me a while to figure this out...but you can keep the '
			+ 'd3.layout.stack() call in place (like the vertical stacked bar chart) '
			+ 'and just get creative with the X and Y scales/axes.<br><br>'
			+ 'Handles zero-value slices well (no Tiger I&#039;s produced 1939-1941, no '
			+ 'Panzer V&#039s between 1939-1942)<br><br>'
			+ 'Data from Wikipedia.  <i>Panzer</i> is German for "tank" or "armor".';
			
		/**
		 * @property
		 * @description Message event relay
		 */
		me.eventRelay = Ext.create('App.util.MessageBus');
			
		/**
 		 * @properties
 		 * @description layout vars and tooltip functions
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		////////////////////////////////////////
		// label functions
		////////////////////////////////////////
 		me.productionLabelFn = function(data, index) {
 			if(data.y == 0) {
	 			return '';
	 		}
	 		return Ext.util.Format.number(data.y, '0,000');
	 	};
		me.pctLabelFn = function(data, index) {
			if(data.y == 0) {
				return '';
			}
			return Ext.util.Format.number(data.y, '0.0') + '%';
		};
		
		////////////////////////////////////////
		// tooltip functions
		////////////////////////////////////////
		me.productionTooltipFn = function(data, index) {
			return '<b>' + data.category + '</b><br>'
				+ Ext.util.Format.number(data.y, '0,000') + ' ' + data.id + '&#039;s';
		};
		me.percentTooltipFn = function(data, index) {
			return '<b>' + data.category + '</b><br>'
				+ Ext.util.Format.number(data.y, '0.00') + '% of<br>'
				+ data.id + ' production.';
		};
		
		////////////////////////////////////////
		// tick format functions
		////////////////////////////////////////
 		me.productionTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000');
		};
		
		me.percentTickFormat = function(d) {
			return Ext.util.Format.number(d, '0') + '%';
		};
		
		/**
 		 * @property
 		 * @description Vertical alignment selector
 		 */
 		me.valignCombo = Ext.create('Ext.form.field.ComboBox', {
	 		store: Ext.create('Ext.data.SimpleStore', {
				fields: ['value'],
				data: [
					['top'],
					['middle'],
					['bottom']
				]
			}),
			displayField: 'value',
	 		valueField: 'value',
	 		editable: false,
		 	typeAhead: true,
		 	queryMode: 'local',
		 	triggerAction: 'all',
		 	width: 75,
		 	listWidth: 75,
		 	value: 'middle',
		 	listeners: {
			 	select: function(combo) {
				 	me.stackedBarChart.setLabelVAlign(combo.getValue());
				 	me.stackedBarChart.transition();
			 	},
			 	scope: me
			}
		});
		
		/**
		 * @property
		 * @type Ext.toolbar.Toolbar
		 */
		me.tbar =[{
			xtype: 'button',
			text: 'Total Produced',
			metric: 'sales',
			cls: me.btnHighlightCss,
			handler: me.metricHandler,
			scope: me
		},
		'-',
		{
			xtype: 'button',
			text: 'Production %',
			metric: 'percent',
			handler: me.metricHandler,
			scope: me
		}, {
			xtype: 'tbspacer',
			width: 25
		}, {
			xtype: 'tbtext',
			text: '<b>Orientation:</b>'
		}, {
			xtype: 'button',
			tooltip: 'Vertical',
			orientationValue: 'vertical',
			iconCls: 'icon-bar-chart',
			handler: me.orientationHandler,
			scope: me
		}, 
			'-',
		{
			xtype: 'button',
			tooltip: 'Horizontal',
			orientationValue: 'horizontal',
			iconCls: 'icon-bar-chart-hoz',
			handler: me.orientationHandler,
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
		}, {
			xtype: 'tbtext',
			text: '<b>Label V-Align</b>'
		},
			me.valignCombo,
		{
			xtype: 'tbspacer',
			width: 10
		}];
		
		/**
 		 * @listener
 		 * @description After render, initialize the canvas
 		 */
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		/**
 		 * @listener
 		 * @description On activate, publish a new message to the "Info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.hozbarstack.MainPanel
 	 * @description Initialize the drawing canvas
 	 */
 	initCanvas: function() {
 	
 		var me = this;
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.final.StackedBarChart', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			colorScale: d3.scale.category20(),
			panelId: me.panelId,
			margins: {
				top: 40,
				right: 10,
				bottom: 50,
				left: 100
			},
			tooltipFunction: me.productionTooltipFn,
			xTickFormat: me.productionTickFormat,
			chartTitle: me.generateChartTitle(),
			showLabels: true,
			showLegend: true,
			chartFlex: 6,
			legendFlex: .75,
			labelFunction: me.productionLabelFn
		});
		
		// retrieve the graph data via AJAX and load the visualization
		Ext.Ajax.request({
			url: 'data/tank_production.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			Ext.each(resp.data, function(rec) {
		 			me.workingGraphData.push(rec);
		 		}, me);
		 		
		 		// reverse the values in each category
		 		//Ext.each(me.workingGraphData, function(obj) {
			 		//obj.values = obj.values.reverse();
			 	//});
			 	
			 	// set graph data and draw
		 		me.stackedBarChart.setGraphData(me.workingGraphData);
		 		me.stackedBarChart.draw();
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
		
		me.stackedBarChart.setChartTitle(me.generateChartTitle(btn.text));
		me.currentMetric = btn.metric;
		
		var dataSet = Ext.clone(me.workingGraphData);
		
		if(btn.metric == 'percent') {
			dataSet = me.normalizePercent(dataSet);
			
			me.stackedBarChart.setLabelFunction(me.pctLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.percentTooltipFn);
			
			if(me.stackedBarChart.chartOrientation == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.percentTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.percentTickFormat);
			}
			
		} else {
			me.stackedBarChart.setLabelFunction(me.productionLabelFn);
			me.stackedBarChart.setGraphData(dataSet);
			me.stackedBarChart.setTooltipFunction(me.productionTooltipFn);
			
			if(me.stackedBarChart.chartOrientation == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.productionTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.productionTickFormat);
			}
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
	 * @description Toggle labels on/off
	 */
	labelHandler: function(btn) {
	 	var me = this;
	 	
		if(btn.currentValue == 'on') {
			btn.currentValue = 'off';
			btn.setText('OFF');
			btn.removeCls(me.btnHighlightCss);
			me.stackedBarChart.setShowLabels(false);
			me.valignCombo.disable();
		} else {
			btn.currentValue = 'on';
			btn.setText('ON');
			btn.addCls(me.btnHighlightCss);
			me.stackedBarChart.setShowLabels(true);
			me.valignCombo.enable();
		}
		
		me.stackedBarChart.transition();
	},
   	
   	/** 
	 * @function
	 * @private
	 * @description Set a new chart title
	 */
	generateChartTitle: function() {
		var me = this;
		
		return me.baseTitle;
	},
	
	/**
 	 * @function
 	 * @description Change the stacked bar orientation (horizontal | vertical)
 	 */
	orientationHandler: function(btn) {
		var me = this;
	
		me.stackedBarChart.setOrientation(btn.orientationValue);
		
		// tick formats
		if(me.currentMetric == 'percent') {
			if(btn.orientationValue == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.percentTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.percentTickFormat);
			}
		} else {
			if(btn.orientationValue == 'horizontal') {
				me.stackedBarChart.setXTickFormat(me.productionTickFormat);
			} else {
				me.stackedBarChart.setYTickFormat(me.productionTickFormat);
			}
		}
		
		me.stackedBarChart.transition();
	}
});