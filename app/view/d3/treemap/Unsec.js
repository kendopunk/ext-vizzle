/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterplot
 * @description 3 tiered treemap
 */
Ext.define('App.view.d3.treemap.Unsec', {
	extend: 'Ext.Panel',
	alias: 'widget.treemapUnsec',
	title: 'Zoomable Treemap',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalZoomableTreeMap'
	],
	
	layout: 'fit',

	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
		me.zTree = null,
			me.rawData,
 			me.canvasWidth,
 			me.canvasHeight,
 			me.panelId,
 			me.availableMetrics = [
 				'Budget Expenditures', 
	 			'Budget Revenues', 
	 			'Gold/Foreign Exchange Reserves',
	 			'Imports',
	 			'Exports'
	 		],
 			me.currentMetrics = [
	 			'Budget Expenditures', 
	 			'Budget Revenues', 
	 			'Gold/Foreign Exchange Reserves'
	 		],
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff';
		
		me.chartDescription = '<b>Zoomable Treemap</b><br><br>'
			+ 'Some random economic data for UN Security Council members.<br><br>'
			+ 'Features:<br>'
			+ ' - Data rebinding<br>'
			+ ' - Click to zoom in<br>'
			+ ' - Double click to zoom out<br><br>'
			+ '<i>All values in dollars.  Source: 2013 CIA World Fact Book</i><br><br>'
			+ 'Ideas from <a href="http://bost.ocks.org/mike/treemap/" target="_blank">bost.ocks.org/mike/treemap/</a>';
			
		me.width = Math.floor(
			(Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95
		);
		me.height = Math.floor(
			(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight) * .95
		);
		
		me.permanentButton = Ext.create('Ext.button.Button', {
			text: 'Permanent Members',
			cls: me.btnHighlightCss,
			disabled: true,
			jsonIndex: 'permanent',
			handler: me.memberHandler,
			scope: me
		});
		
		me.thirteenFourteenButton = Ext.create('Ext.button.Button', {
			text: '2013-14 Members',
			disabled: true,
			jsonIndex: 'thirteenFourteen',
			handler: me.memberHandler,
			scope: me
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{xtype: 'tbspacer', width: 5},
				me.permanentButton,
				{xtype: 'tbspacer', width: 10},
				me.thirteenFourteenButton
			]
		}];
		
		/**
 		 * @listeners
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.treemap.Unsec
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		
		// initialize SVG, width, height
		me.canvasWidth = me.body.dom.offsetWidth,
			me.canvasHeight = me.body.dom.offsetHeight,
 			me.panelId = '#' + me.body.id;
 			
	 	Ext.Ajax.request({
		 	url: 'data/unsec_data.json',
		 	method: 'GET',
		 	success: function(response) {
			 	me.rawData = Ext.JSON.decode(response.responseText);
			 	
			 	me.zTree = Ext.create('App.util.d3.UniversalZoomableTreeMap', {
	 				panelId: me.panelId,
	 				canvasWidth: me.canvasWidth,
	 				canvasHeight: me.canvasHeight,
	 				graphData: me.colorizeGraphData(me.rawData.permanent),
	 				chartTitle: 'Economic Data : UN Security Council Members',
	 				sizeMetric: 'value',
	 				sticky: false,
	 				showTooltips: true,
	 				colorDefinedInData: true,
	 				valueMetric: 'value',
	 				tooltipFunction: function(d, i) {
		 				if(d.children) { return null; }
		 				
		 				return '<b>' + d.parent.name + '</b><br>'
			 				+ '<i>' + d.name + '</i><br>'
			 				+ Ext.util.Format.currency(d.value, false, '0', false);
		 			},
		 			textFunction: function(d, i) {
			 			return d.children ? null : d.name;
			 		}
	 			});
				
				me.zTree.initChart().draw();
	 		},
	 		callback: function() {
	 			me.permanentButton.setDisabled(false);
		 		me.thirteenFourteenButton.setDisabled(false);
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.treemap.Unsec
 	 * @description Add color metrics to the data
 	 */
	colorizeGraphData: function(obj) {
		var me = this,
			colorScale = d3.scale.category10(),
			ind = 0,
			hiColor, lowColor, localColorScale;
			
		Ext.each(obj.children, function(levelOne) {
			hiColor = colorScale(ind);
			
			lowColor = '#' + App.util.Global.hexLightenDarken(hiColor, 45);
			
			localColorScale = d3.scale.linear().domain([
				d3.min(levelOne.children, function(d) { return d.value; }),
				d3.max(levelOne.children, function(d) { return d.value; })
			]).range([lowColor, hiColor]);
				
			Ext.each(levelOne.children, function(child) {
				child.color = localColorScale(child.value);
			});
			
			ind++;
		});
		
		return obj;
	},
	
	memberHandler: function(btn) {
		var me = this;
		
		if(btn.jsonIndex == 'thirteenFourteen') {
			btn.addCls(me.btnHighlightCss);
			me.permanentButton.removeCls(me.btnHighlightCss);
		} else {
			btn.addCls(me.btnHighlightCss);
			me.thirteenFourteenButton.removeCls(me.btnHighlightCss);
		}
		
		me.zTree.setGraphData(me.colorizeGraphData(me.rawData[btn.jsonIndex])).draw();
	}
});