/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.bar
 * @description Grouping bar chart
 */
Ext.define('App.view.d3.bar.GroupedBar', {
	extend: 'Ext.Panel',
	alias: 'widget.barGroup',
	title: 'Grouped Bar Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.GroupedBarChart'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.workingData = [],
 			me.dataIndex = 'meat',
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.groupedBarChart = null,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-peachpuff',
 			me.cbxHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Grouped Bar Chart</b><br><br>'
			+ '<i>Meat & Dairy consumption (lbs. per capita) in the US over the last 50 years...</i><br><br>'
			+ 'Use the checkboxes to view decade-to-decade comparisons<br><br>'
			+ 'Data from <a href="http://www.usda.gov">USDA</a>.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		//////////////////////////////////////////////////
		// toolbar buttons
		//////////////////////////////////////////////////
		me.meatButton = Ext.create('Ext.button.Button', {
			iconCls: 'icon-steak',
			text: 'Meat',
			cls: me.btnHighlightCss,
			tooltip: 'Meat',
			handler: function(btn) {
				me.dataIndex = 'meat';
				btn.addCls(me.btnHighlightCss);
				
				me.dairyButton.removeCls(me.btnHighlightCss);
				
				me.groupedBarChart.setChartTitle('Meat Consumption');
				
				me.draw();
			},
			scope: me
		});
		
		me.dairyButton = Ext.create('Ext.button.Button', {
			iconCls: 'icon-cow',
			text: 'Dairy',
			tooltip: 'Dairy',
			handler: function(btn) {
				me.dataIndex = 'dairy';
				btn.addCls(me.btnHighlightCss);
				
				me.meatButton.removeCls(me.btnHighlightCss);
				
				me.groupedBarChart.setChartTitle('Dairy Consumption');
				
				me.draw();
			},
			scope: me
		});
		
		/**
 		 * runtime configuration of checkboxes
 		 */
 		var checkboxData = [];
 		Ext.each(['1950s', '1960s', '1970s', '1980s', '1990s', '2000'], function(year) {
	 		checkboxData.push({
	 			xtype: 'checkboxfield',
		 	 	boxLabel: year,
		 	 	name: 'years',
		 	 	inputValue: year,
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
	 		},
	 		{xtype: 'tbspacer', width: 7}
	 		);
	 	}, me);
		
		/**
 	 	 * @property
 	 	 * @description Docked items
 	 	 */
 	 	me.dockedItems = [{
	 	 	xtype: 'toolbar',
	 	 	dock: 'top',
	 	 	items: [{
		 	 	xtype: 'tbspacer',
		 	 	width: 10
		 	},
		 		me.meatButton,
		 		'-',
		 		me.dairyButton,
		 	{xtype: 'tbspacer', width: 30},
		 		checkboxData
		 	]
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
 	 */
	checkboxChange: function(cbx, oldVal, newVal) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.cbxHighlightCss);
		} else {
			cbx.removeCls(me.cbxHighlightCss);
		}
		
		me.draw();
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.bar.GroupedBar
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
	 	var me = this;
	 	
	 	// width, height
	 	me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
	 	me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 		me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
		 	.append('svg')
		 	.attr('width', me.canvasWidth)
		 	.attr('height', me.canvasHeight);
		 	
		var colorScale = d3.scale.category20();
		 	
		// configured the grouped bar chart
		me.groupedBarChart = Ext.create('App.util.d3.final.GroupedBarChart', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			graphData: [],
			chartTitle: 'Meat Consumption',
			fixedColorRange: {
				'1950s': colorScale(1),
				'1960s': colorScale(2),
				'1970s': colorScale(3),
				'1980s': colorScale(4),
				'1990s': colorScale(5),
				'2000': colorScale(6),
			},
			fixedColorRangeIndex: 'name',
			margins: {
				top: 40,
				right: 10,
				bottom: 60,
				left: 100,
				leftAxis: 85
			},
			yTickFormat: function(d) {
				return Ext.util.Format.number(d, '0.0') + ' lbs';
			},
			tooltipFunction: function(d, i) {
				return '<b>' + d.name + ' ' + d.grouper + ' Consumption</b><br>'
					+ Ext.util.Format.number(d.value, '0.0')
					+ ' lbs/person.';
			}
		});
		
		// check off the first available checkbox
		var found = false;
		Ext.each(me.query('toolbar[dock=top] checkboxfield'), function(cbx) {
			if(!found) {
				cbx.setValue(!cbx.getValue());
				found = true;
			}
		}, me);
	 },
	 
	 /**
 	  * @function
 	  */
 	 draw: function() {

	 	var me = this,
	 		filterData = [];
	 
	 	////////////////////////////////////////
	 	// figure out the checkboxes to filter on
	 	////////////////////////////////////////
	 	var checkboxes = me.query('toolbar[dock=top] checkboxfield');
		if(checkboxes.length == 0) {
			return;
		}
		
		Ext.each(checkboxes, function(cbx) {
			if(cbx.checked) {
				filterData.push(cbx.inputValue);
			}
		});
		
		if(filterData.length == 0) {
			return;
		}
		
		////////////////////////////////////////
		// request the data, if applicable
		////////////////////////////////////////
		if(!me.svgInitialized) {
			me.getEl().mask('Loading...');
			
			Ext.Ajax.request({
				url: 'data/usda_protein.json',
				method: 'GET',
				success: function(response) {
					var resp = Ext.JSON.decode(response.responseText);
				
					me.workingData = resp;
					
					me.graphData = me.normalizeJsonData(resp[me.dataIndex], filterData);
					me.groupedBarChart.setGraphData(me.graphData);
					me.groupedBarChart.draw();
					me.groupedBarChart.triggerGroupers(false);
				},
				callback: function() {
					me.getEl().unmask();
					me.svgInitialized = true;
				},
				scope: me
			});
		} else {
			me.graphData = me.normalizeJsonData(me.workingData[me.dataIndex], filterData);
			me.groupedBarChart.setGraphData(me.graphData);
			me.groupedBarChart.transition();
			me.groupedBarChart.triggerGroupers(true);
	 	}
	 },
	 
	 /**
 	  * @function
 	  */
	 normalizeJsonData: function(data, filterData, firstT) {
	 	var me = this,
		 	workingData = [],
		 	ind = 1,
		 	colorInd = 0,
		 	colorScale = d3.scale.category20();
		 
		// build working data
	 	Ext.each(data, function(entry) {
		 	if(filterData.indexOf(entry.year) >= 0) {
			 	Ext.each(entry.consumption, function(c) {
			 	
			 		workingData.push({
				 		id: ind.toString(),
				 		name: entry.year,
				 		value: c.percapita,
				 		grouper: c.type,
				 		color: colorScale(colorInd)
				 	});
				 	
				 	ind++;
			 	});
			 	
			 	colorInd++;
			 }
		});
		
		// first sort...sort based on "grouper"
		var ret = Ext.Array.sort(workingData, function(a, b) {
			if(a.grouper > b.grouper) {
				return 1;
			} else if(a.grouper < b.grouper) {
				return -1;
			} else {
				return 0;
			}
		});
		
		return ret;
	}
});