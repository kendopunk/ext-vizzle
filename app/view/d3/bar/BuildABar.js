/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Drag and drop bar chart
 */
Ext.define('App.view.d3.bar.BuildABar', {
	extend: 'Ext.Panel',
	alias: 'widget.barBuild',
	title: 'Build-A-Bar',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalBar',
		'App.util.ColumnDefinitions',
		'App.store.stock.StockStore'
	],
	
	layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Build-A-Bar</b><br><br>'
			+ 'Drag record(s) from grid to main panel to dynamically build a bar chart.<br><br>'
			+ 'Use ctrl + click to select multiple records.';
			
		// layout vars
		me.gridPanelWidth = 330,
			me.vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width
				- 330
				- App.util.Global.westPanelWidth
			),
			me.vizPanelHeight = parseInt(
				Ext.getBody().getViewSize().height
				- App.util.Global.titlePanelHeight
				- 15
			),
			me.eventRelay = Ext.create('App.util.MessageBus');
			
		// control vars
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.g,
 			me.panelId,
 			me.barChart = null,
 			me.defaultMetric = 'price',
 			me.currentMetric = 'price',
 			me.defaultMetricText = 'Price',
 			me.baseTitle = 'Random Stock Data',
 			me.dropTarget,
 			me.btnHighlightCss = 'btn-highlight-khaki';
 			
 		//////////////////////////////////////////////////
 		// TOOLBAR COMPONENTS
 		//////////////////////////////////////////////////
 		me.priceButton = Ext.create('Ext.button.Button', {
 			text: 'Price',
 			disabled: true,
 			metric: 'price',
 			cls: me.btnHighlightCss,
 			handler: me.metricHandler,
 			scope: me
 		});
 		
 		me.changeButton = Ext.create('Ext.button.Button', {
 			text: 'Change',
 			disabled: true,
 			metric: 'change',
 			handler: me.metricHandler,
 			scope: me
 		});
 		
 		me.pctChangeButton = Ext.create('Ext.button.Button', {
 			text: '% Change',
 			disabled: true,
 			metric: 'pctChange',
 			handler: me.metricHandler,
 			scope: me
 		});
 		
 		me.customizeButton = Ext.create('Ext.button.Button', {
			iconCls: 'icon-tools',
			text: 'Customize',
			disabled: true,
			menu: [{
				text: 'Labels',
				menu: [{
					text: 'Horizontal',
					itemId: 'babLabelHoz',
					iconCls: 'icon-tick',
					handler: function(btn) {
						me.down('#babLabelVert').setIconCls('');
						me.down('#babLabelNone').setIconCls('');
						btn.setIconCls('icon-tick');
						
						me.barChart.setShowLabels(true);
						me.barChart.setLabelOrientation('horizontal');
						me.barChart.draw();
					},
					scope: me
				}, {
					text: 'Vertical',
					itemId: 'babLabelVert',
					handler: function(btn) {
						me.down('#babLabelHoz').setIconCls('');
						me.down('#babLabelNone').setIconCls('');
						btn.setIconCls('icon-tick');
						
						me.barChart.setShowLabels(true);
						me.barChart.setLabelOrientation('vertical');
						me.barChart.draw();
					},
					scope: me
				}, {
					text: 'OFF',
					itemId: 'babLabelNone',
					handler: function(btn) {
						me.down('#babLabelVert').setIconCls('');
						me.down('#babLabelHoz').setIconCls('');
						btn.setIconCls('icon-tick');
						
						me.barChart.setShowLabels(false);
						me.barChart.draw();
					},
					scope: me
				}]
			}, {
				text: 'Sort',
				menu: [{
					text: 'A-Z',
					itemId: 'azSortBtn',
					handler: function(btn) {
						me.down('#zaSortBtn').setIconCls('');
						me.down('#valueSortBtn').setIconCls('');
						
						btn.setIconCls('icon-tick');
						me.barChart.setSortType('az', 'ticker');
						me.barChart.draw();
					},
					scope: me
				}, {
					text: 'Z-A',
					itemId: 'zaSortBtn',
					handler: function(btn) {
						me.down('#azSortBtn').setIconCls('');
						me.down('#valueSortBtn').setIconCls('');
						
						btn.setIconCls('icon-tick');
						me.barChart.setSortType('za', 'ticker');
						me.barChart.draw();
					},
					scope: me
				}, {
					text: 'Value',
					itemId: 'valueSortBtn',
					handler: function(btn) {
						me.down('#azSortBtn').setIconCls('');
						me.down('#zaSortBtn').setIconCls('');
						
						btn.setIconCls('icon-tick');
						me.barChart.setSortType('_metric_', null);
						me.barChart.draw();
					},
					scope: me
				}]
			}, {
				text: 'Color Scheme',
				iconCls: 'icon-color-wheel',
				menu: {
					items: Ext.Array.map(App.util.Global.svg.colorSchemes, function(obj) {
						return {
							text: obj.name,
							handler: function(btn) {
								me.barChart.setColorPalette(obj.palette);
								me.barChart.draw();
							},
							scope: me
						}
					}, me)
				}
			}]
 		});
 		
 		me.revertButton = Ext.create('Ext.button.Button', {
	 		text: 'Clear/Revert',
	 		iconCls: 'icon-refresh',
	 		disabled: true,
	 		handler: function(btn, e) {
		 		btn.disable();
		 		
		 		me.graphData = [];
		 		me.barChart.setGraphData(me.graphData);
		 		me.barChart.draw();
		 		
	 			me.store.load();
	 		}
	 	});
 		
 		// viz panel (north)
 		me.vizPanel = Ext.create('Ext.Panel', {
	 		region: 'west',
	 		width: me.vizPanelWidth,
	 		height: me.vizPanelHeight,
	 		layout: 'fit',
	 		plain: true,
	 		autoScroll: true, 
	 		listeners: {
		 		afterrender: function(panel) {
		 			me.loadGridStore();
	 		
					panel.dropTarget = Ext.create('Ext.dd.DropTarget', panel.body.dom, {
		 				ddGroup: 'vizPanelDDGroup',
		 				notifyEnter: function(ddSource, e, data) {
			 				//console.log('entered panel...');
			 			},
			 			notifyDrop: function(ddSource, e, data) {
			 				if(!me.svgInitialized) {
			 					me.initCanvas(data.records);
			 				} else {
			 					me.transitionRecords(data.records);
			 				}
			 				
			 				return true;
			 			}
			 		});
			 	},
			 	scope: me
			},
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [
					me.priceButton,
		  			{xtype: 'tbspacer', width: 10},
		  			me.changeButton,
		  			{xtype: 'tbspacer', width: 10},
		  			me.pctChangeButton,
		  			'->',
		  			me.customizeButton,
		  			'-',
		  			me.revertButton
		  		]
		  	}]
	 	});
	 	
	 	/**
		 * @property
		 * @description Grid store
		 */
		me.store = Ext.create('App.store.stock.StockStore');
	 	
	 	/**
	 	 * @property
	 	 * @description Grid panel
	 	 */
	 	me.gridPanel = Ext.create('Ext.grid.Panel', {
	 		region: 'center',
	 		store: me.store,
	 		title: 'Stock Data',
	 		width: 300,
	 		height: '100%',
	 		plain: true,
			autoScroll: true,
			title: 'Grid',
			multiSelect: true,
			forceFit: true,
			stripeRows: true,
			enableDragDrop: true,
			viewConfig: {
				plugins: {
					ptype: 'gridviewdragdrop',
					ddGroup: 'vizPanelDDGroup',
					enableDrop: false
				}
			},
			columns: [
				App.util.ColumnDefinitions.tickerSymbol,
 				App.util.ColumnDefinitions.tickerPrice,
 				App.util.ColumnDefinitions.tickerChange,
 				App.util.ColumnDefinitions.tickerPctChange
 			]
	 	});
			
		me.items = [me.vizPanel, me.gridPanel];
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.buildabar.VizPanel
 	 * @description Initialize the drawing canvas
 	 * @param records Array of record objects
 	 */
 	initCanvas: function(records) {
	 	var me = this;
	 	
	 	me.vizPanel.getEl().mask('Drawing...');
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
	 		me.canvasWidth = parseInt(me.vizPanel.body.dom.offsetWidth * .96),
	 		me.canvasHeight = parseInt(me.vizPanel.body.dom.offsetHeight * .96),
 			me.panelId = '#' + me.vizPanel.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// init graph data
	 	Ext.each(records, function(rec) {
		 	me.graphData.push(rec.data);
		}, me);
		
		// remove from grid
		me.store.remove(records);
		
		// enabled buttons
		Ext.each(me.vizPanel.getDockedItems()[0].query('button'), function(btn) {
			btn.enable();
		}, me);

		// build the chart
	 	me.barChart = Ext.create('App.util.d3.UniversalBar', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: me.graphData,
			dataMetric: me.defaultMetric,
			panelId: me.panelId,
			showLabels: true,
			labelFunction: function(data, index) {
				return data.ticker;
			},
			margins: {
				top: 20,
				right: 10,
				bottom: 15,
				left: 100,
				leftAxis: 85
			},
			tooltipFunction: function(data, index) {
				return '<b>' + data.name + '</b> (' + data.ticker + ')<br><br>'
					+ 'Close Price: ' + Ext.util.Format.currency(data.price)
					+ '<br>'
					+ 'Change: ' + Ext.util.Format.currency(data.change)
					+ '<br>'
					+ '% Change: ' + Ext.util.Format.number(data.pctChange, '0,000.0') + '%';
			},
			handleEvents: false,
			chartTitle: me.buildChartTitle(me.defaultMetricText),
			yTickFormat: App.util.Global.svg.currencyTickFormat
		}, me);
		
		me.barChart.initChart().draw();
		
		me.vizPanel.getEl().unmask();
	},
	
	/**
	 * @function
	 */
	metricHandler: function(btn, event) {
		var me = this;
		
		btn.addCls(me.btnHighlightCss);
		
		me.barChart.setChartTitle(me.buildChartTitle(btn.text));
		
		// adjust the buttons
		if(btn.text == 'Change') {
			me.priceButton.removeCls(me.btnHighlightCss);
			me.pctChangeButton.removeCls(me.btnHighlightCss);
			
			me.barChart.setYTickFormat(App.util.Global.svg.currencyTickFormat);
		} else if(btn.text == '% Change') {
			me.priceButton.removeCls(me.btnHighlightCss);
			me.changeButton.removeCls(me.btnHighlightCss);
			
			me.barChart.setYTickFormat(App.util.Global.svg.percentTickFormat);
		} else {
			me.changeButton.removeCls(me.btnHighlightCss);
			me.pctChangeButton.removeCls(me.btnHighlightCss);
			
			me.barChart.setYTickFormat(App.util.Global.svg.currencyTickFormat);
		}
		
		me.barChart.setDataMetric(btn.metric);
		me.barChart.draw();
	},
	
	/**
 	 * @function
 	 */
	transitionRecords: function(records) {
		var me = this;
		
		Ext.each(records, function(rec) {
			me.graphData.push(rec.data);
		}, me);
		
		// enable revert button
		me.revertButton.enable();
		
		// remove from store
		me.store.remove(records);
		
		// update
		me.barChart.setGraphData(me.graphData);
		me.barChart.draw();
	},
	
	/**
	 * @function
	 */
	loadGridStore: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		me.store.load({
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
	buildChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append;
	}
});