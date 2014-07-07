/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Simple pie chart panel
 */
Ext.define('App.view.d3.pie.GenericPie', {
	extend: 'Ext.Panel',
	alias: 'widget.pieGeneric',
	title: 'Pie Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.responsive.ResponsivePie'
	],
	
	layout: 'fit',
	autoScroll: true,
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.baseTitle = 'Top Calibers Reported on 2012 Firearm Traces',
 			me.availableStates = [],
 			me.atfData = null,
 			me.defaultMetric = 'recovery',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Simple Pie Chart</b><br><br>'
			+ 'Top calibers in firearm recoveries, 2012.  Data from ATF.<br><br>'
			+ 'Convert the pie chart to a donut chart by using the <b>Inner Radius</b> options in the toolbar';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt(Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>State:</b>'
			}, {
				xtype: 'button',
				text: 'Texas',
				abbrev: 'TX',
				targetIndex: 0,
				cls: me.btnHighlightCss,
				handler: me.handleStateSelection,
				scope: me
			},
				'-',
			{
				xtype: 'button',
				text: 'New York',
				abbrev: 'NY',
				targetIndex: 1,
				handler: me.handleStateSelection,
				scope: me
			},
				'-',
			{
				xtype: 'button',
				text: 'Arkansas',
				abbrev: 'AR',
				targetIndex: 2,
				handler: me.handleStateSelection,
				scope: me
			},
			'->',
			{xtype: 'tbtext', text: '<b>Inner Radius:</b>'},
			{
				xtype: 'combo',
				store: Ext.create('Ext.data.Store', {
					fields: ['display', 'value'],
					data: [
						{display: '0%', value: 0},
						{display: '25%', value: .25},
						{display: '50%', value: .5},
						{display: '75%', value: .75},
						{display: '95%', value: .95}
					]
				}),
				width: 75,
				listWidth: 75,
				editable: false,
				displayField: 'display',
				valueField: 'value',
				value: '0',
				listeners: {
					select: function(combo) {
						me.innerRadiusHandler(combo.getValue());
					},
					scope: me
				}
			}, {
				xtype: 'tbspacer',
				width: 10
			}, {
				xtype: 'checkbox',
				boxLabel: 'Legend',
				listeners: {
					change: function(cbx, nv, ov) {
						me.pieChart.toggleLegend(nv).draw();
					}
				}
			}, {
				xtype: 'tbspacer',
				width: 10
			}, {
				xtype: 'checkbox',
				boxLabel: 'Labels',
				checked: true,
				listeners: {
					change: function(cbx, nv, ov) {
						me.pieChart.setShowLabels(nv);
						me.pieChart.draw();
					}
				}
			}, {
				xtype: 'tbspacer',
				width: 10
			}]
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
	 * @memberOf App.view.d3.pie.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
	 	var me = this;
	 	
	 	me.getEl().mask('Drawing...');
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = parseInt(me.body.dom.offsetWidth * .98),
	 		me.canvasHeight = parseInt(me.body.dom.offsetHeight * .95),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);

		// init pie chart
		me.pieChart = Ext.create('App.util.d3.responsive.ResponsivePie', {
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			panelId: me.panelId,
			dataMetric: 'recovery',
			chartFlex: 3,
			legendFlex: 1,
			margins: {
				top: 40
			},
			graphData: [],
			chartTitle: me.buildChartTitle('TX'),
			showLabels: true,
			labelFunction: function(d, i) {
				return d.data.caliber;
			},
			tooltipFunction: function(d, i) {
				return '<b>' + d.data.caliber + '</b><br>'
					+ Ext.util.Format.number(d.data.recovery, '0,000')
					+ ' recoveries';
			},
			showLegend: false,
			legendTextFunction: function(d, i) {
				return d.caliber;
			}
		});
		
	 	// get the data via Ajax call
	 	Ext.Ajax.request({
	 		url: 'data/atf_trace_data.json',
	 		method: 'GET',
	 		success: function(response) {
	 			var resp = Ext.JSON.decode(response.responseText);
	 			
	 			// unique states
	 			Ext.each(resp.data, function(rec) {
		 			me.availableStates.push(rec.state);
		 		}, me);
		 		
		 		me.atfData = resp.data;
		 		
		 		me.pieChart.setGraphData(resp.data[0].recoveries);
		 		
		 		me.pieChart.initChart().draw();
	 		},
	 		callback: function() {
	 			me.getEl().unmask();
	 		},
	 		scope: me
	 	});
	 },
	 
	 /**
	  * @function
	  * @memberOf App.util.d3.pie
	  * @description Handle state selection button click
	  */
	 handleStateSelection: function(button, event) {
	 	var me = this;
	 	
	 	// remove the cls
	 	Ext.each(me.getDockedItems()[0].query('button'), function(btn) {
		 	if(btn.abbrev) {
			 	btn.removeCls(me.btnHighlightCss);
			}
		}, me);
		button.addCls(me.btnHighlightCss);
	 	
	 	// set chart title
	 	me.pieChart.setChartTitle(me.buildChartTitle(button.abbrev));
	 	
	 	// set data and transition
	 	me.pieChart.setGraphData(me.atfData[button.targetIndex]['recoveries']);
	 	me.pieChart.draw();
	 },

	/**
 	 * @function
 	 * @description Handle radius change buttons
 	 */
	innerRadiusHandler: function(pct) {
	 	var me = this;
	 	
	 	me.pieChart.setInnerRadius(parseInt(me.pieChart.outerRadius * pct));
	 	me.pieChart.draw();
	},
	 
	/**
	 * @function
	 * @memberOf App.util.d3.pie
	 * @description Build a new chart title
	 */
	buildChartTitle: function(append) {
		var me = this;
		
		return me.baseTitle + ' : ' + append + ' Recoveries';
	}
});