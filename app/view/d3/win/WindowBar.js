Ext.define('App.view.d3.win.WindowBar', {
	extend: 'Ext.window.Window',
	alias: 'widget.win_responsiveBar',
	
	requires: [
		'App.util.d3.responsive.ResponsiveBar'
	],
	
	modal: true,
	layout: 'fit',
	constrain: true,
	resizable: true,
	initialResize: false,
	
	bodyCls: 'responsiveWin',
	
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
 			me.defaultHeight = me.height,
 			me.fruits = ['Apple', 'Pear', 'Peach', 'Mango', 'Papaya'];
 		
 		Ext.each(me.fruits, function(item) {
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
					
					Ext.each(me.fruits, function(item) {
						me.graphData.push({
							fruit: item,
							count: Math.floor(Math.random() * 100) + 1
						});
					}, me);
		
					me.barChart.setGraphData(me.graphData);
					me.barChart.draw();
			 	},
			 	scope: me
			}]
		}];
		
		/**
 		 * @listeners
 		 */
 		me.on('afterrender', me.initCanvas, me);
 		me.on('resize', me.resizeHandler, me);
		
		me.callParent(arguments);
	},
	
	initCanvas: function(panel) {
		var me = this;
	 	
	 	// width, height
	 	me.canvasWidth = Math.floor(me.body.dom.offsetWidth),
	 	me.canvasHeight = Math.floor(me.body.dom.offsetHeight),
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
				return d.fruit
					+ ' ('
					+ Ext.util.Format.number(d.count, '0,000')
					+ ')';
			},
			chartFlex: 5,
			legendFlex: 2,
			handleEvents: false,
			chartTitle: 'Fruits',
			yTickFormat: App.util.Global.svg.numberTickFormat
		});
		
		// initialize chart and draw
		me.barChart.initChart().draw();
		
		me.chartDrawn = true;
	},
	
	resizeHandler: function(win, w, h) {
		var me = this;
		
		me.canvasWidth = Math.floor(win.body.dom.offsetWidth),
		me.canvasHeight = Math.floor(win.body.dom.offsetHeight);
	 	
	 	if(me.chartDrawn) {
	 		me.barChart.resize(me.canvasWidth, me.canvasHeight);
	 	}
	}
});