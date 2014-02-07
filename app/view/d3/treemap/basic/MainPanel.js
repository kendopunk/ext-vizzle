/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterplot
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.treemap.basic.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.treemapBasicMainPanel',
	title: 'Basic Treemap',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.TreeMap'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.graphData = [],
	 		me.treemap = null,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.panelId,
 			me.defaultMetric = 'wins',
 			me.baseTitle = 'NFL Team Stats',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Basic Treemap</b><br><br>'
		 + '<i>Some random NFL team statistics...</i><br><br>'
		 + 'Data from <a href="http://www.pro-football-reference.com/teams/">pro-football-reference.com</a>.  '
		 + 'Team hex colors from <a href="http://teamcolors.arc90.com/">teamcolors.arc90.com</a>.  '
		 + 'Team values from Forbes.';

		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
		 * metric combo store
		 */
		me.metricStore = Ext.create('Ext.data.SimpleStore', {
			fields: ['display', 'value'],
			data: [
				['Franchise Wins', 'wins'],
				['Franchise Losses', 'losses'],
				['Franchise Value', 'teamvalue']
			]
		});
		
		////////////////////////////////////////
		// text functions
		////////////////////////////////////////
		me.winsTextFunction = function(d, i) {
			return d.children ? null : d.team + ' (' + d.wins + ')';
		};
		me.lossesTextFunction = function(d, i) {
			return d.children ? null : d.team + ' (' + d.losses + ')';
		};
		me.valueTextFunction = function(d, i) {
			return d.children ? null : d.team + ' ($' 
				+ Ext.util.Format.number(d.teamvalue/1000000000, '0.000')
				+ ' bn)';
		};
	 	
		/**
 		 * top toolbar
 		 */
 		me.dockedItems = {
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbtext',
		 		text: '<b>Metric:</b>'
		 	}, {
			 	xtype: 'combo',
			 	name: 'metric',
			 	store: me.metricStore,
			 	displayField: 'display',
			 	valueField: 'value',
			 	editable: false,
			 	typeAhead: true,
			 	queryMode: 'local',
			 	triggerAction: 'all',
			 	width: 160,
			 	listWidth: 160,
			 	value: 'wins',
			 	listeners: {
			 		select: function(combo) {
				 		if(combo.getValue() == 'teamvalue') {
					 		me.treemap.setTextFunction(me.valueTextFunction);
					 	} else if(combo.getValue() == 'losses') {
						 	me.treemap.setTextFunction(me.lossesTextFunction);
						} else {
							me.treemap.setTextFunction(me.winsTextFunction);
						}
			 		
				 		me.treemap.setChartTitle(
					 		me.buildChartTitle(combo.getValue())
					 	);
					 	
					 	me.treemap.setDefaultMetric(combo.getValue());
					 	
					 	me.treemap.transition();
			 		}
			 	},
			 	scope: me
			}]
	 	};
		
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
	 * @memberOf App.view.d3.treemap.basic.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.canvasWidth = parseInt(me.getWidth() * .95),
 			me.canvasHeight = parseInt(me.getHeight() * .85) - 35,
 			me.panelId = '#' + me.body.id;
 			
	 	Ext.Ajax.request({
		 	url: 'data/nfl_tree.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
	 		
	 			me.graphData = resp;

	 			me.treemap = Ext.create('App.util.d3.final.TreeMap', {
	 				panelId: me.panelId,
	 				canvasWidth: me.canvasWidth,
	 				canvasHeight: me.canvasHeight,
	 				graphData: resp,
	 				chartTitle: me.buildChartTitle(me.defaultMetric),
	 				colorDefinedInData: true,
	 				defaultMetric: me.defaultMetric,
	 				textFunction: me.winsTextFunction
	 			});
				
				me.treemap.draw();
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	},
	
	/**
	 * @function
	 */
	buildChartTitle: function(metric) {
		var me = this;
		
		var ret = me.baseTitle;
		
		switch(metric) {
			case 'losses':
			return ret + ': Franchise Losses';
			break;
			
			case 'sb':
			return ret + ': Super Bowl Wins';
			break;
			
			case 'conf':
			return ret + ': Conference Championships since Start of Super Bowl';
			break;
			
			default:
			return ret + ': Franchise Wins';
			break;
		}
	}
});