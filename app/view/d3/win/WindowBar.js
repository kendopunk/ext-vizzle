Ext.define('App.view.d3.win.WindowBar', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.win_responsiveBar',
	
	requires: [
		'App.util.d3.responsive.ResponsiveBar'
	],
	
	canvasScaleFactor: .98,
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.chartDrawn = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.barChart = null,
 			me.defaultWidth = me.width,
 			me.defaultHeight = me.height;
 		
 		Ext.each(['Apple', 'Pear', 'Peach', 'Orange', 'Melon'], function(item) {
	 		me.graphData.push({
		 		fruit: item,
		 		count: Math.floor(Math.random() * 100) + 1
		 	});
		}, me);
 		
 		/**
  		 * toolbar
  		 */
 		me.dockedItems = [{
	 		xtype: 'toolbar',
	 		dock: 'top',
	 		items: [{
		 		xtype: 'tbtext',
		 		text: 'Resize window to view chart reponse'
		 	},
		 	'-',
		 	{
		 		text: 'Randomize',
		 		iconCls: 'icon-arrow-switch',
		 		handler: function() {
					me.graphData = [];
					
					Ext.each(['Apple', 'Pear', 'Peach', 'Orange', 'Melon'], function(item) {
						me.graphData.push({
							fruit: item,
							count: Math.floor(Math.random() * 100) + 1
						});
					}, me);
		
					me.barChart.setGraphData(me.graphData);
					me.barChart.draw();
			 	},
			 	scope: me
			},
			'-',
			{
				xtype: 'tbtext',
				text: '<b>Resize:</b>'
			}, {
				xtype: 'button',
				text: '50%',
				handler: function() {
					me.setWidth(Math.floor(me.defaultWidth * .5));
					me.setHeight(Math.floor(me.defaultHeight * .5));
					me.resizeHandler();
				},
				scope: me
			}, {
				xtype: 'button',
				text: '75%',
				handler: function() {
					me.setWidth(Math.floor(me.defaultWidth * .75));
					me.setHeight(Math.floor(me.defaultHeight * .75));
					me.resizeHandler();
				},
				scope: me
			}, {
				xtype: 'button',
				text: '100%',
				handler: function() {
					me.setWidth(me.defaultWidth);
					me.setHeight(me.defaultHeight);
					me.resizeHandler();
				},
				scope: me
			}]
		}];
		
		/**
 		 * @listeners
 		 */
 		me.on('afterrender', me.initCanvas, me);
		
		me.callParent(arguments);
	},
	
	initCanvas: function(panel) {
		var me = this;
	 	
	 	// width, height
	 	me.canvasWidth = Math.floor(me.body.dom.offsetWidth * me.canvasScaleFactor),
	 	me.canvasHeight = Math.floor(me.body.dom.offsetHeight * me.canvasScaleFactor),
 		me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight);
	 		
	 	// init bar chart
	 	me.barChart = Ext.create('App.util.d3.responsive.ResponsiveBar', {
	 		svg: me.svg,
	 		canvasWidth: me.canvasWidth,
	 		canvasHeight: me.canvasHeight,
	 		dataMetric: 'count',
	 		graphData: me.graphData,
	 		panelId: me.panelId,
	 		orientation: 'horizontal',
	 		margins: {
				top: 20,
				right: 10,
				bottom: 10,
				left: 100,
				leftAxis: 85
			},
			showLabels: true,
			labelFunction: function(d, i) {
		 		return d.fruit;
		 	},
			tooltipFunction: function(d, i) {
				return '<b>' + d.fruit + '</b><br>'
					+ d.count;
			},
			showLegend: true,
			legendTextFunction: function(d, i) {
				return d.fruit;
			},
			chartFlex: 4,
			legendFlex: 1,
			handleEvents: false,
			chartTitle: 'Fruits',
			yTickFormat: App.util.Global.svg.numberTickFormat
		});
		
		// initialize chart and draw
		me.barChart.initChart().draw();
		
		me.chartDrawn = true;
	},
	
	resizeHandler: function() {
		var me = this;
	
		me.canvasWidth = Math.floor(me.body.dom.offsetWidth * me.canvasScaleFactor),
	 	me.canvasHeight = Math.floor(me.body.dom.offsetHeight * me.canvasScaleFactor);
	 	
	 	me.barChart.resize(me.canvasWidth, me.canvasHeight);
	}
});