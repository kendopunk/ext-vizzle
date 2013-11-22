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
		'App.util.d3.StackedBarLegendChart'
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
 			me.eventRelay = Ext.create('App.util.MessageBus');
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Stacked Bar Chart w/Legend</b><br><br>'
		+ 'Again, we use flex values for the chart and the legend to position them relative to one another';
			
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
		me.salesTooltipFn = function(data, index) {
			return '<b>' + data.id + '</b><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0,000');
		};
		me.salesTickFormat = function(d) {
			return Ext.util.Format.number(d, '0,000');
		};
		me.percentTooltipFn = function(data, index) {
			return '<b>' + data.id + '</b><br>'
				+ data.category + ' Sales: '
				+ Ext.util.Format.number(data.y, '0.00') + '%';
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
				me.addRandomButton.enable();
				me.albumRevert();
			},
			scope: me,
			hidden: true,
			disabled: true
		}, me);
		
		me.addRandomButton = Ext.create('Ext.button.Button', {
			text: 'Add Random Record',
			iconCls: 'icon-plus',
			tooltip: 'Add a random album',
			handler: function() {
				me.addRandomAlbum();
			},
			scope: me
		});
		
		/**
		 * @property
		 * @type Ext.toolbar.Toolbar
		 */
		me.tbar =[{
				xtype: 'button',
				text: 'By Total Sales',
				metric: 'sales',
				iconCls: 'icon-album',
				handler: me.metricHandler,
				scope: me
			}, {
				xtype: 'button',
				text: 'Percentage Breakdown',
				metric: 'percent',
				iconCls: 'icon-percent',
				handler: me.metricHandler,
				scope: me
			},
			'-',
			me.albumRemoveButton,
			me.albumRevertButton,
			'->',
			{
				xtype: 'button',
				text: 'Randomize',
				iconCls: 'icon-arrow-switch',
				tooltip: 'Make up some random data',
				handler: function() {
					me.albumRevertButton.enable();
					me.randomizeData();
				},
				scope: me
			},
			'-',
			me.addRandomButton
		]
		
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
	 		
	 	me.stackedBarChart = Ext.create('App.util.d3.StackedBarLegendChart', {
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
			chartFlex: 6,
			legendFlex: 1,
			legendFontSize: 11,
			mouseEvents: {
				mouseover: {
					enabled: true,
					eventName: 'legendAlbumRemove'
				}
			}
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
  		
  		var newData = Ext.clone(me.graphData);
  		for(i=0; i<newData.length; i++) {
  			newData[i].values.splice(index, 1);
  		}
  		
  		me.graphData = newData;
  		me.stackedBarChart.setGraphData(newData);
  		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
  		me.stackedBarChart.transition();
  	},
  	
  	/**
   	 * @function
   	 * @description Revert back to original graphData values
   	 */
  	albumRevert: function() {
  		var me = this;
  		
  		me.graphData = me.originalGraphData;
  	
  		me.stackedBarChart.setGraphData(me.graphData);
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
		
		me.currentMetric = btn.metric;
		
		me.stackedBarChart.setChartTitle(me.generateChartTitle(btn.text));
		
		var dataSet = Ext.clone(me.graphData);
		
		if(btn.metric == 'percent') {
			//me.stackedBarChart.setGraphData(me.normalizePercent(dataSet));
			
			var temp = me.normalizePercent(dataSet);
			me.stackedBarChart.setGraphData(temp);
			me.stackedBarChart.setTooltipFunction(me.percentTooltipFn);
			me.stackedBarChart.setYTickFormat(me.percentTickFormat);
		} else {			
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
		
		var newData = Ext.clone(me.originalGraphData);
		
		Ext.each(newData, function(rec) {
			Ext.each(rec.values, function(v) {
				Ext.each(v, function(obj) {
					obj.y = parseInt(Math.random() * 2000000);
				});
			})
		});
		
		me.graphData = newData;
		me.stackedBarChart.setGraphData(newData);
		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
	},
	
	/**
 	 * @function
 	 */
 	addRandomAlbum: function() {
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
	 	
	 	var ind = parseInt(Math.floor(Math.random() * randomAlbums.length));
	 	
	 	var add = randomAlbums[ind];
	 	
	 	var newData = Ext.clone(me.graphData);
	 	
	 	Ext.each(newData, function(rec) {
	 		rec.values.push({
	 			id: add.id,
	 			artist: add.artist,
	 			category: rec.category,
	 			y: parseInt(Math.random() * 5000000)
	 		})
	 	});
 		
 		me.graphData = newData;
 		me.stackedBarChart.setGraphData(newData);
		me.stackedBarChart.setTooltipFunction(me.salesTooltipFn);
		me.stackedBarChart.setYTickFormat(me.salesTickFormat);
		me.stackedBarChart.transition();
 	
 		
 		me.addRandomButton.disable();
 	}
});
