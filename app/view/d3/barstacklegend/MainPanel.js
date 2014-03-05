/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.barstack
 * @description Stacked bar chart
 */
Ext.define('App.view.d3.barstacklegend.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.barstackLegendMainPanel',
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
 			me.graphData = [],
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
		me.chartDescription = '<b>Stacked Bar ++</b><br><br>'
		+ 'Again, we use flex values for the chart and the legend to position them relative to one another.<br><br>'
		+ 'Toolbar actions added to randomize data and/or append data.';
			
		/**
		 * @property
		 * @description Message event relay
		 */
		me.eventRelay = Ext.create('App.util.MessageBus');
		me.eventRelay.subscribe('legendAlbumRemove', me.handleRemoveButton, me);
			
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
			return '<b>' + data.artist + '</b><br>'
				+ '<i>' + data.id + '</i><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0,000');
		};
		
		me.percentTooltipFn = function(data, index) {
			return '<b>' + data.artist + '</b><br>'
				+ '<i>' + data.id + '</i><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0.00') + '%';
		};
		
		/**
 		 * axis tick functions
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
		
		/**
 		 * toolbar buttons
 		 */
 		me.salesMetricButton = Ext.create('Ext.button.Button', {
			text: 'By Total Sales',
			metric: 'sales',
			iconCls: 'icon-album',
			cls: me.btnHighlightCss,
			handler: me.metricHandler,
			scope: me
		});
		
		me.pctMetricButton = Ext.create('Ext.button.Button', {
			text: 'By Pct. Sales',
			metric: 'percent',
			iconCls: 'icon-percent',
			handler: me.metricHandler,
			scope: me
		});
		
		me.dataRevertButton = Ext.create('Ext.button.Button', {
			text: 'Revert Data',
			tooltip: 'Revert back to original data',
			iconCls: 'icon-refresh',
			handler: function(btn) {
				me.addRandomButton.enable();
				me.albumRevert();
			},
			scope: me,
			disabled: true
		}, me);
		
		me.addRandomButton = Ext.create('Ext.button.Button', {
			text: 'Random Album',
			iconCls: 'icon-plus',
			tooltip: 'Add a random album',
			btnCount: 0,
			handler: me.addRandomAlbum,
			scope: me
		});
		
		/**
		 * @property
		 * @type Ext.toolbar.Toolbar
		 */
		me.tbar =[
			me.salesMetricButton,
			me.pctMetricButton,
			{xtype: 'tbspacer', width: 15},
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
			}, 
			'->',
			{
				xtype: 'button',
				text: 'Randomize',
				iconCls: 'icon-arrow-switch',
				tooltip: 'Make up some random data',
				handler: function() {
					me.dataRevertButton.enable();
					me.randomizeData();
				},
				scope: me
			},
			'-',
			me.addRandomButton,
			'-',
			me.dataRevertButton
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
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.final.StackedBarChart', {
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
			chartFlex: 5,
			legendFlex: .75,
			legendFontSize: '10px',
			showLabels: true,
			showLegend: true,
			labelFunction: me.salesLabelFn
		});
		
		// retrieve the graph data via AJAX and load the visualization
		Ext.Ajax.request({
			url: 'data/album_sales.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			Ext.each(resp.data, function(rec) {
		 			me.graphData.push(rec);
		 			me.originalGraphData.push(rec);
		 		}, me);
		 		
		 		me.stackedBarChart.setGraphData(me.graphData);
		 		me.stackedBarChart.draw();
		 	},
		 	scope: me
		 });
 	},
  	
  	/**
   	 * @function
   	 * @description Revert back to original graphData values
   	 */
  	albumRevert: function() {
  		var me = this;
  		
  		me.graphData = me.originalGraphData;
  		
  		me.salesMetricButton.addCls(me.btnHighlightCss);
		me.pctMetricButton.removeCls(me.btnHighlightCss);
  	
  		me.stackedBarChart.setGraphData(me.graphData);
  		me.stackedBarChart.setLabelFunction(me.salesLabelFn);
  		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
  		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
		
		me.dataRevertButton.disable();
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
				if(button.metric !== undefined) {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
		me.currentMetric = btn.metric;
		
		me.stackedBarChart.setChartTitle(me.generateChartTitle(btn.text));
		
		var dataSet = Ext.clone(me.graphData);
		
		if(btn.metric == 'percent') {
			var temp = me.normalizePercent(dataSet);
			
			me.stackedBarChart.setLabelFunction(me.pctLabelFn);
			me.stackedBarChart.setGraphData(temp);
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
	},
	
	/**
 	 * @function
 	 */
	randomizeData: function() {
		var me = this;
		
		var newData = Ext.clone(me.graphData);
		
		Ext.each(newData, function(rec) {
			Ext.each(rec.values, function(v) {
				Ext.each(v, function(obj) {
					obj.y = parseInt(Math.random() * 2000000);
				});
			})
		});
		
		me.salesMetricButton.addCls(me.btnHighlightCss);
		me.pctMetricButton.removeCls(me.btnHighlightCss);
		
		me.graphData = newData;
		me.stackedBarChart.setGraphData(newData);
		me.stackedBarChart.setLabelFunction(me.salesLabelFn);
		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
	},
	
	/**
 	 * @function
 	 */
 	addRandomAlbum: function(btn) {
 		var me = this;
 		
 		var randomAlbums = [{
	 		id: '1984',
	 		artist: 'Van Halen'
	 	}, {
	 		id: 'Unplugged',
	 		artist: 'Eric Clapton'
	 	}, {
	 		id: 'No Jacket Required',
	 		artist: 'Phil Collins'
	 	}, {
	 		id: 'Private Dancer',
	 		artist: 'Tina Turner'
	 	}, {
	 		id: 'Boston',
	 		artist: 'Boston'
	 	}, {
	 		id: 'The Joshua Tree',
	 		artist: 'U2'
	 	}, {
	 		id: 'Nevermind',
	 		artist: 'Nirvana'
	 	}, {
	 		id: 'Abbey Road',
	 		artist: 'The Beatles'
	 	}];
	 	
	 	var albumToAdd = randomAlbums[btn.btnCount];
	 	
	 	btn.btnCount = btn.btnCount + 1;
	 	
	 	if(btn.btnCount == randomAlbums.length) {
		 	btn.disable();
		 	btn.btnCount = 0;
		}
	 	
	 	// clone and add
	 	var newData = Ext.clone(me.graphData);
	 	Ext.each(newData, function(rec) {
	 		rec.values.push({
	 			id: albumToAdd.id,
	 			artist: albumToAdd.artist,
	 			category: rec.category,
	 			y: parseInt(Math.random() * 5000000)
	 		})
	 	});
	 	
	 	// button cls
	 	me.salesMetricButton.addCls(me.btnHighlightCss);
		me.pctMetricButton.removeCls(me.btnHighlightCss);
 		
 		// set and transition
 		me.graphData = newData;
 		me.stackedBarChart.setGraphData(newData);
 		me.stackedBarChart.setLabelFunction(me.salesLabelFn);
		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
		
		// allow revert
		me.dataRevertButton.enable();
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
		} else {
			btn.currentValue = 'on';
			btn.setText('ON');
			btn.addCls(me.btnHighlightCss);
			me.stackedBarChart.setShowLabels(true);
		}
		
		me.stackedBarChart.transition();
	}
});
