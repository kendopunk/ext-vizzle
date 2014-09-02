/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Generic bar chart
 */
Ext.define('App.view.d3.bar.GenericBar', {
	extend: 'Ext.Panel',
	alias: 'widget.barGeneric',
	title: 'Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.store.movie.MovieStore',
		'App.store.movie.MovieMetricStore',
		'App.util.JsonBuilder',
		'App.util.d3.UniversalBar',
		'Ext.window.MessageBox',
		'App.util.ColumnDefinitions'
	],
	
	title: 'Basic Bar Chart',
	
	layout: 'border',
	defaults: {
		split: true
	},
	
	initComponent: function() {
		var me = this;
		
		// chart description for info panel
		me.chartDescription = '<b>Basic Bar Chart</b><br><br>'
			+ 'Movie data taken from <a href="http://www.imdb.com">IMDB</a> and <a href="http://www.boxofficemojo.com">Box Office Mojo</a>. '
			+ 'Tooltips from <a href="http://bl.ocks.org/milroc/2975255">milroc</a>.<br><br>'
			+ 'Use the toolbar buttons to view transitions.<br><br>'
			+ 'Employs the use of Ext.util.Observable subclass to handle messaging from the SVG visualization to the ExtJS framework (mouse over bar = grid row highlight)';
		
		// layout vars
		me.gridPanelHeight = 225,
			me.vizPanelWidth = parseInt(
				Ext.getBody().getViewSize().width - 225
			),
			me.vizPanelHeight = parseInt(
				(Ext.getBody().getViewSize().height 
					- App.util.Global.titlePanelHeight 
					- me.gridPanelHeight
					- 15)
			),
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.gridHighlightEvent = 'barGenericGridHighlight';
			
		// pub/sub
		me.eventRelay.subscribe(me.gridHighlightEvent, me.gridRowHighlight, me);
			
		// shared store
		me.movieStore = Ext.create('App.store.movie.MovieStore');
		
		// control vars
		me.svgInitialized = false,
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
 			me.btnHighlightCss = 'btn-highlight-peachpuff',
 			me.btnToggleCss = 'btn-highlight-aquamarine',
 			me.eventRelay = Ext.create('App.util.MessageBus');
 			
 		// color scheme menu options
 		var colorSchemeMenu = Ext.Array.map(App.util.Global.svg.colorSchemes, function(obj) {
	 		return {
		 		text: obj.name,
		 		handler: function(btn) {
			 		//btn.setIconCls('icon-tick');
			 		me.barChart.setColorPalette(obj.palette);
			 		me.barChart.draw();
			 	},
			 	scope: me
			}
		}, me);

		// visualization panel (north)
		me.vizPanel = Ext.create('Ext.Panel', {
			region: 'north',
			collapsible: true,
			collapsed: false,
			hideCollapseTool: true,
			width: me.vizPanelWidth,
			height: me.vizPanelHeight,
			layout: 'fit',
			autoScroll: true,
			dockedItems: [{
	  			xtype: 'toolbar',
		  		dock: 'top',
		  		items: [{
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
				},
				{xtype: 'tbspacer', width: 5},
				'-',
				{xtype: 'tbspacer', width: 5},
				{
					xtype: 'button',
					iconCls: 'icon-tools',
					text: 'Customize',
					menu: [{
						xtype: 'menucheckitem',
						text: 'Legend',
						listeners: {
							checkchange: function(cbx, checked) {
								me.barChart.setShowLegend(checked);
								me.barChart.draw();
							},
							scope: me
						}
					}, {
						text: 'Labels',
						menu: [{
							text: 'Horizontal',
							itemId: 'labelHoz',
							iconCls: 'icon-tick',
							handler: function(btn) {
								me.down('#labelVert').setIconCls('');
								me.down('#labelNone').setIconCls('');
								btn.setIconCls('icon-tick');
								
								me.barChart.setShowLabels(true);
								me.barChart.setLabelOrientation('horizontal');
								me.barChart.draw();
							},
							scope: me
						}, {
							text: 'Vertical',
							itemId: 'labelVert',
							handler: function(btn) {
								me.down('#labelHoz').setIconCls('');
								me.down('#labelNone').setIconCls('');
								btn.setIconCls('icon-tick');
								
								me.barChart.setShowLabels(true);
								me.barChart.setLabelOrientation('vertical');
								me.barChart.draw();
							},
							scope: me
						}, {
							text: 'OFF',
							itemId: 'labelNone',
							handler: function(btn) {
								me.down('#labelVert').setIconCls('');
								me.down('#labelHoz').setIconCls('');
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
								me.barChart.setSortType('az', 'title');
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
								me.barChart.setSortType('za', 'title');
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
							xtype: 'menu',
							items: colorSchemeMenu
						}
					}]	
				}]
			}],
			listeners: {
				afterrender: me.initCanvas,
				resize: me.resizeHandler,
				scope: me
			}
		});
		
		// grid panel (center)
		me.gridPanel = Ext.create('Ext.grid.Panel', {
			region: 'center',
			title: 'Movie Data (Grid)',
			store: me.movieStore,
			cls: 'gridRowSelection',
			columns: [
				App.util.ColumnDefinitions.movieTitle,
 				App.util.ColumnDefinitions.grossBO,
 				App.util.ColumnDefinitions.numTheaters,
 				App.util.ColumnDefinitions.openingBO,
 				App.util.ColumnDefinitions.releaseDate,
 				App.util.ColumnDefinitions.imdbRating
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
	 * @description Initialize drawing canvas
	 */
	initCanvas: function(panel) {
		var me = this;
		
		panel.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.svgInitialized = true,
	 		me.canvasWidth = Math.floor(panel.body.dom.offsetWidth * .95),
	 		me.canvasHeight = Math.floor(panel.body.dom.offsetHeight * .95),
 			me.panelId = '#' + panel.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// bar chart shell
	 	me.barChart = Ext.create('App.util.d3.UniversalBar', {
	 		svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			dataMetric: me.defaultMetric,
			graphData: [],
			panelId: me.panelId,
			showLabels: true,
			orientation: 'horizontal',
			labelFunction: function(data, index) {
				return data.title;
			},
			margins: {
				top: 20,
				right: 10,
				bottom: 10,
				left: 110,
				leftAxis: 90
			},
			tooltipFunction: function(data, index) {
				return '<b>' + data.title + '</b> (' + data.release+ ')<br>'
					+ 'Gross: ' + Ext.util.Format.currency(data.gross, false, '0', false) + '<br>'
					+ 'Theaters: ' + data.theaters + '<br>'
					+ 'Opening: ' + Ext.util.Format.currency(data.opening, false, '0', false) + '<br>'
					+ 'IMDB Rating: ' + data.imdbRating;
			},
			handleEvents: true,
			mouseEvents: {
				mouseover: {
					enabled: true,
					eventName: me.gridHighlightEvent
				}
			},
			chartTitle: me.buildChartTitle(me.defaultMetricText),
			yTickFormat: App.util.Global.svg.wholeDollarTickFormat,
			chartFlex: 4,
			legendFlex: 1,
			legendTextFunction: function(d, i) {
				return d.title;
			}
		}, me);
	 		
	 	// load store render chart
	 	me.movieStore.load({
	 		callback: function(records) {
	 			me.graphData = App.util.JsonBuilder.buildMovieDataJson(records);	// as is
	 			
		 		me.barChart.setGraphData(me.graphData);
		 		me.barChart.initChart().draw();
		 		
				panel.getEl().unmask();
			},
			scope: me
		});
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.bar.VizPanel
	 * @description Toolbar button handler
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
		// button cls
		Ext.each(me.vizPanel.query('toolbar > button'), function(button) {
			if(btn.hasOwnProperty('metric')) {
				if(button.metric == btn.metric) {
					button.addCls(me.btnHighlightCss);
				} else {
					button.removeCls(me.btnHighlightCss);
				}
			}
		}, me);
		
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
		me.barChart.setChartTitle(me.buildChartTitle(btn.text));
		me.barChart.setDataMetric(btn.metric);
		me.barChart.draw();
	},
	
	/** 
	 * @function
	 * @private
	 * @description Set a new chart title
	 */
	buildChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append;
	},
	
	/**
	 * @function
	 */
	resizeHandler: function(panel, w, h) {
		var me = this;
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.bar.GridPanel
 	 * @param obj Generic obj {title: ''}
 	 * @description Attempt to highlight a grid row based on a movie title value
 	 */
	gridRowHighlight: function(obj) {
		var me = this;
		
		var record = me.gridPanel.getStore().findRecord('title', obj.payload.title);
		if(record) {
			var rowIndex = me.gridPanel.getStore().indexOf(record);
			me.gridPanel.getSelectionModel().select(rowIndex);
		}
	}
});