5/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.chart.misc
 * @description Chart.js miscellaneous charts
 */
Ext.define('App.view.chart.misc.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.chartMiscMainPanel',
	title: 'Line/Area Chart',
	closable: true,
	
	requires: [
		'App.util.MessageBus'
	],
	
	bodyStyle: {
		padding: '10px'
	},
	
	layout: {
		type: 'table',
		columns: 2
	},

	initComponent: function() {
		var me = this;
		
 		me.eventRelay = Ext.create('App.util.MessageBus');

		me.chartDescription = '<b>Chart.js</b><br><br>'
			+ 'Chart.js uses HTML5 and the canvas element.  While not as flexible and customizable as other libraries, it provides a high-level abstraction for implementing visualizations quickly and easily.<br><br>'
			+ 'Canvas elements placed in ExtJS table layout.  Shout out to <a href="http://www.jsjoy.com/blog/62/ext-js-and-canvas-integration">jsjoy.com</a> for info on implementing &lt;canvas&gt; in ExtJS.';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
 		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @property
 		 * @description The <canvas> tag
 		 */
 		me.items = [{
	 		xtype: 'box',
	 		autoEl: {
		 		tag: 'canvas',
		 		width: 200,
		 		height: 200
		 	}
		 }, {
	 		xtype: 'box',
	 		autoEl: {
		 		tag: 'canvas',
		 		width: 500,
		 		height: 200
		 	}
		 }, {
			 xtype: 'box',
			 colspan: 2,
			 autoEl: {
				 tag: 'canvas',
				 width: 700,
				 height: 300
			 }
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
	 * @memberOf App.view.d3.scatterplot.MainPanel
	 * @description Initialize drawing canvas
	 */
	initCanvas: function() {
		var me = this;
		
		var ctxPolar = me.items.items[0].el.dom.getContext('2d'),
			ctxLine = me.items.items[1].el.dom.getContext('2d');
			ctxRadar = me.items.items[2].el.dom.getContext('2d');
			
		////////////////////////////////////////////////////////////
		// polar coordinates
		////////////////////////////////////////////////////////////
		var polarData = [{
			value : 30,
			color: "#D97041"
		}, {
			value : 90,
			color: "#C7604C"
		}, {
			value : 24,
			color: "#21323D"
		}, {
			value : 58,
			color: "#9D9B7F"
		}, {
			value : 82,
			color: "#7D4F6D"
		}, {
			value : 8,
			color: "#584A5E"
		}];
		new Chart(ctxPolar).PolarArea(polarData);
		
		////////////////////////////////////////////////////////////
		// line
		////////////////////////////////////////////////////////////
		var lineData = {
			labels: [
				'OH', 'VA', 'MT', 'LA', 'TX', 'UT'
			],
			datasets: [{
				fillColor: 'rgba(186, 220, 220, .7)',
				strokeColor: 'rgba(33, 33, FF, 0.8)',
				pointColor: 'rgba(204, 51, 0, .8)',
				pointColorStroke: '#FFF',
				data: [112, 88, 173, 77, 105, 166]
			}, {
				fillColor: 'rgba(255, 204, 51, .4)',
				strokeColor: 'rgba(0, 255, 0, .9)',
				pointColor: 'rgba(0, 0, 0, 1)',
				pointColorStroke: 'rgba(255, 204, 0, .8)',
				data: [66, 117, 77, 81, 155, 99]
			}]
		};
		
		new Chart(ctxLine).Line(lineData);
		
		////////////////////////////////////////////////////////////
		// radar
		// TO DO...check Firebug warnings about fill color
		////////////////////////////////////////////////////////////
		var d1 = [],
			d2 = [];
			
		for(i=0; i<6; i++) {
			d1.push(Math.floor(Math.random() * 100));
		}
		
		for(i=0; i<6; i++) {
			d2.push(Math.floor(Math.random() * 100));
		}
		
		var radarData = {
			labels: [
				'Apples',
				'Oranges',
				'Bananas',
				'Peaches',
				'Star Fruit',
				'Durian'
			],
			datasets: [{
				fillColor: 'rgba(255, 204, 33, 0.4)',
				strokeColor: 'rgba(255, 204, 33, 1)',
				pointColor: 'rgba(204, 204, 204, 1)',
				pointStrokeColor: 'rgba(200, 200, 200, 1)',
				data: d1
			}, {
				fillColor: 'rgba(151,187,205,0.5)',
				strokeColor: 'rgba(151,187,205,1)',
				pointColor: 'rgba(151,187,205,1)',
				pointStrokeColor: '#FFF',
				data: d2
			}]
		};
		
		new Chart(ctxRadar).Radar(radarData);
	 }
});