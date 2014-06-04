/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Sunburst partition layout
 */
Ext.define('App.view.d3.pie.Sunburst', {
	extend: 'Ext.Panel',
	alias: 'widget.sunburstPartition',
	title: 'Sunburst Partitionasdfasfds',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.RadialTree'
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
 			me.currentMetric = 'wins',
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Sunburst/Radial Tree</b><br><br>'
			+ '<i>PGA Tour wins, majors and career earnings by geographic region for select players.</i><br><br>'
			+ 'Data from <a href="http://www.pgatour.com">pgatour.com</a> and '
			+ '<a href="http://www.databasegolf.com">databasegolf.com</a>.';
			
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
				xtype: 'button',
				text: 'Career Wins',
				cls: me.btnHighlightCss,
				metricName: 'wins',
				handler: me.metricHandler,
				scope: me
			}, 
			'-',
			{
				xtype: 'button',
				text: 'Majors',
				metricName: 'majors',
				handler: me.metricHandler,
				scope: me
			},
			'-',
			{
				xtype: 'button',
				text: 'Earnings',
				metricName: 'money',
				handler: me.metricHandler,
				scope: me
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
		
		me.getEl().mask('Loading...');
	 	
	 	me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
 			me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
 			
 		me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight)
	 		.attr('transform', 'translate(' + Math.floor(me.canvasWidth/2) + ',' + Math.floor(me.canvasHeight/2) + ')');
	 	
	 	Ext.Ajax.request({
		 	url: 'data/golfers.json',
		 	method: 'GET',
		 	success: function(response) {
				var resp = Ext.JSON.decode(response.responseText);
				var stub = me.generateGraphData();
				
	 			me.radialChart = Ext.create('App.util.d3.final.RadialTree', {
		 			svg: me.svg,
		 			canvasWidth: me.canvasWidth,
		 			canvasHeight: me.canvasHeight,
		 			graphData: resp,
		 			//graphData: me.generateGraphData(),
		 			panelId: me.panelId,
		 			dataMetric: me.currentMetric,
		 			labelFunction: function(d, i) {
			 			return d.name;
			 		},
			 		tooltipFunction: function(d, i) {
				 		if(d.depth > 1) {
					 		return '<b>' + d.name + '</b><br>'
						 		+ 'Wins: ' + d.wins + '<br>'
						 		+ 'Majors: ' + d.majors + '<br>'
						 		+ 'Earnings: '
						 		+ Ext.util.Format.currency(d.money, false, '0', false);
					 		
					 	} else {
					 		return d.name;
					 	}
				 	}
		 		}, me);
	 			
	 			me.radialChart.draw();
	 		},
	 		callback: function() {
		 		me.getEl().unmask();
		 	},
	 		scope: me
	 	});
	},
	
	/**
	 * @function
	 * @description Handle metric change
	 */
	metricHandler: function(btn, evt) {
		var me = this;
		
	 	// remove then add the cls
	 	Ext.each(me.getDockedItems()[0].query('button'), function(btn) {
		 	btn.removeCls(me.btnHighlightCss);
		}, me);
		btn.addCls(me.btnHighlightCss);
		
		me.currentMetric = btn.metricName;
		me.radialChart.setDataMetric(btn.metricName);
		me.radialChart.transition();
		
		return;
	},
	
	generateGraphData: function() {
		var ret = [],
			regions = ['USA', 'ASIA/PACIFIC', 'EUROPE'],
			temp;
		
		Ext.each(regions, function(r) {
			temp = {
				name: r,
				wins: Math.floor(Math.random() * 20) + 1,
				majors: Math.floor(Math.random() * 6) + 1,
				money: Math.floor(Math.random() * 2000000) + 1,
				children: []
			};
			
			ret.push(temp);
		});

		return {
			name: 'root',
			children: ret
		};
	}
});