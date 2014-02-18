/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Simple scatterplot panel
 */
Ext.define('App.view.d3.slope.debt.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.debtSlopeMainPanel',
	title: 'Slopegraph',
	closable: true,
	
	frame: false,
	border: false,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.SlopeGraph'
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
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.startYear = 1986,
 			me.endYear = 2013,
 			me.baseTitle = 'National Debt vs GDP, ';
	 	
	 	// year slider
	 	me.yearSlider = Ext.create('Ext.slider.Multi', {
	 		hideLabel: true,
		 	minValue: me.startYear,
		 	maxValue: me.endYear,
		 	increment: 1,
		 	values: [me.startYear, me.endYear],
		 	width: 400,
		 	disabled: true,
		 	listeners: {
			 	change: me.handleSlider,
			 	scope: me
			}
		});

 		me.chartDescription = '<b>Edward Tufte\'s Slopegraph</b><br><br>'
	 		+ '<i>US national debt vs GDP, 1986-2013.</i><br><br>'
	 		+ 'Red indicates debt/GDP ratio >= 90%...uses a threshold scale for line color with domain of 0.9.  Tooltips triggered by left axis text mouseover.<br><br>'
	 		+ 'Data from <a href="http://useconomy.about.com/od/usdebtanddeficit/a/National-Debt-by-Year.htm">about.com</a> and <a href="http://www.dof.ca.gov/html/fs_data/LatestEconData/Chronology/chronology.htm">California DOF</a>.<br><br>'
		 	+ 'See this <a href="http://www.visualisingdata.com/index.php/2013/12/in-praise-of-slopegraphs/">good article</a> for more info...';
			
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		//////////////////////////////////////////////////
		// label functions
		//////////////////////////////////////////////////
		me.debtLabelFn = function(d) {
			return d.year + ' - $'
				+ Ext.util.Format.number(d.debt, '0,000');
		};
		me.gdpLabelFn = function(d) {
			return d.year + ' - $'
				+ Ext.util.Format.number(d.gdp, '0,000');
		};
		
		//////////////////////////////////////////////////
		// tooltip function
		//////////////////////////////////////////////////
		me.tooltipFn = function(data, index) {
			return '<b>' + data.year + '</b><br>'
				+ 'Debt ' + Ext.util.Format.number((data.debt/data.gdp)*100, '0,000') + '% of GDP<br><br>'
				+ '<b>Notable Events:</b><br>-'
				+ data.notes.join('<br>-');
		};
		
		//////////////////////////////////////////////////
		// tbar
		//////////////////////////////////////////////////
		me.dockedItems = {
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbtext',
		 		text: '<b>Years</b>'
		 	},
		 		me.yearSlider
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
 			me.canvasHeight = parseInt(me.getHeight() * .95) - 35,
 			me.panelId = '#' + me.body.id;
 			
 		// init svg
	 	me.svg = d3.select(me.panelId)
		 	.append('svg')
		 	.attr('width', me.canvasWidth)
		 	.attr('height', me.canvasHeight);
 			
	 	Ext.Ajax.request({
		 	url: 'data/national_debt.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
	 		
	 			me.graphData = resp.data;
	 			
	 			me.slopegraph = Ext.create('App.util.d3.final.SlopeGraph', {
	 				svg: me.svg,
	 				panelId: me.panelId,
	 				canvasWidth: me.canvasWidth,
	 				canvasHeight: me.canvasHeight,
	 				graphData: me.graphData,
	 				leftMetric: 'debt',
	 				leftLabel: 'Debt (billions)',
	 				leftLabelFn: me.debtLabelFn,
	 				rightMetric: 'gdp',
	 				rightLabel: 'GDP (billions)',
	 				rightLabelFn: me.gdpLabelFn,
	 				chartTitle: me.baseTitle + me.startYear + '-' + me.endYear,
	 				margins: {
						top: 70,
						right: 130,
						rightText: 120,
						bottom: 10,
						left: 160,
						leftText: 20
					},
					thresholdScale: d3.scale.threshold().domain([0.9]),
					tooltipFunction: me.tooltipFn
	 			});
				
				me.slopegraph.draw();
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 		me.yearSlider.enable();
		 	},
	 		scope: me
	 	});
	},
	
	handleSlider: function(slider) {
		var me = this,
			values = slider.getValues(),
			newData = [];
			
		Ext.each(me.graphData, function(d) {
			if(parseInt(d.year) >= parseInt(values[0]) && parseInt(d.year) <= parseInt(values[1])) {
				newData.push(d);
			}
		}, me);
		
		me.slopegraph.setGraphData(newData);
		me.slopegraph.setChartTitle(me.baseTitle + values[0] + '-' + values[1]);
		me.slopegraph.transition();
	}
});