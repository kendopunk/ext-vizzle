/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.scatterplot
 * @description 3 tiered treemap
 */
Ext.define('App.view.d3.treemap.Unsec', {
	extend: 'Ext.Panel',
	alias: 'widget.treemapUnsec',
	title: 'Basic Treemap',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalTreeMap'
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
		
		me.chartDescription = '<b>Treemap 2</b><br><br>'
			+ 'Economic data for UN Security Council permanent members.  Magnitude-based color scale applied to subdivisions in each category.<br><br>'
			+ '- Budget Expenditures<br>'
			+ '- Budget Revenues<br>'
			+ '- Exports<br>'
			+ '- Imports<br>'
			+ '- Gold/Foreign Exchange Reserves<br><br>'
			+ '<i>All values in dollars.  Source: 2013 CIA World Fact Book</i>';
			
			
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		
		// checkboxes for toolbar
		var checkboxConfig = [];
		Ext.each(me.availableMetrics, function(met) {
			checkboxConfig.push({
				xtype: 'tbspacer',
				width: 7
			}, {
				xtype: 'checkboxfield',
				boxLabel: met,
				inputValue: met,
				checked: me.currentMetrics.indexOf(met) >= 0,
				cls: me.currentMetrics.indexOf(met) >= 0 ? me.btnHighlightCss : null,
				listeners: {
					change: me.checkboxChange,
					scope: me
				}
			});
		}, me);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: checkboxConfig
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
	 * @memberOf App.view.d3.treemap.Unsec
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		me.getEl().mask('Loading...');
		
		// initialize SVG, width, height
 		me.canvasWidth = parseInt(me.body.dom.offsetWidth * .9),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .9),
 			me.panelId = '#' + me.body.id;
 			
	 	Ext.Ajax.request({
		 	url: 'data/unsec_data.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				
				me.graphData = me.colorizeGraphData(resp);
	 		
	 			me.treemap = Ext.create('App.util.d3.UniversalTreeMap', {
	 				panelId: me.panelId,
	 				canvasWidth: me.canvasWidth,
	 				canvasHeight: me.canvasHeight,
	 				graphData: me.pareData(),
	 				chartTitle: 'Economic Data : UN Security Council Permanent Members',
	 				sizeMetric: 'value',
	 				sticky: false,
	 				showTooltips: true,
	 				colorDefinedInData: true,
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
				
				me.treemap.initChart().draw();
	 		},
	 		callback: function() {
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
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.treemap.Unsec
 	 * @description Pare down original data to only those selected
 	 */
	pareData: function() {
		var me = this,
			dat = {name: 'root', children: []};
		
		Ext.each(me.graphData.children, function(gd) {
			if(me.currentMetrics.indexOf(gd.name) >= 0) {
				dat.children.push(gd);
			}
		}, me);
		
		return dat;
	},
	
	checkboxChange: function(cbx) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.btnHighlightCss);
		} else {
			cbx.removeCls(me.btnHighlightCss);
		}
		
		////////////////////////////////////////
	 	// figure out the checkboxes to filter on
	 	////////////////////////////////////////
	 	var checkboxes = me.query('toolbar[dock=top] checkboxfield');
	 	if(checkboxes.length == 0) { return; }	// no checkboxes ??
	 	
		me.currentMetrics = [];
		Ext.each(checkboxes, function(cbx) {
			if(cbx.checked) {
				me.currentMetrics.push(cbx.inputValue);
			}
		}, me);
		
		var pared = me.pareData();

		me.treemap.setGraphData(pared);
		me.treemap.draw();
	}
});