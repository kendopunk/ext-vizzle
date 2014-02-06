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
 			me.baseTitle = 'Superbowl Teams',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Basic Treemap</b>';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
 		me.winsButton = Ext.create('Ext.button.Button', {
	 		text: 'By Wins',
	 		metric: 'sbwins',
	 		cls: me.btnHighlightCss,
	 		disabled: true,
	 		handler: function(btn) {
		 		btn.addCls(me.btnHighlightCss);
		 		me.avgPtsButton.removeCls(me.btnHighlightCss);
		 		
		 		me.treemap.setChartTitle(me.buildChartTitle(btn.metric));
		 		
		 		me.treemap.transition();
	 		},
	 		scope: me
	 	});
	 	
	 	me.avgPtsButton = Ext.create('Ext.button.Button', {
	 		text: 'By Avg. Points',
	 		metric: 'avgpts',
	 		disabled: true,
	 		handler: function(btn) {
		 		btn.addCls(me.btnHighlightCss);
		 		me.winsButton.removeCls(me.btnHighlightCss);
		 		
		 		me.treemap.setChartTitle(me.buildChartTitle(btn.metric));
		 		
		 		me.treemap.transition();
	 		},
	 		scope: me
	 	});
	 	
		/**
 		 * top toolbar
 		 */
 		me.dockedItems = {
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbspacer',
		 		width: 10
		 	},
		 		me.winsButton,
		 		'-',
		 		me.avgPtsButton
		 	]
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
	 				chartTitle: me.buildChartTitle('sbwins'),
	 				textFunction: function(d, i) {
		 				return d.children ? null : d.team + ' (' + d.sbwins + ')';
		 			}
	 			});
				
				me.treemap.draw();
				
				me.enableButtons(true);
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	},
	
	enableButtons: function(turnOn) {
		var me = this;
		
		me.winsButton.setDisabled(!turnOn);
		me.avgPtsButton.setDisabled(!turnOn);
	},
	
	buildChartTitle: function(metric) {
		var me = this;
		
		var ret = me.baseTitle;
		
		switch(metric) {
			case 'avgpts':
			return ret + ': By Avg Points';
			break;
			
			default:
			return ret + ': By # of Wins';
			break;
		}
	}
});