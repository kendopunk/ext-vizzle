/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.geo.basic
 * @description Basic mapping / geo panel
 */
Ext.define('App.view.d3.geo.basic.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.geoBasicMainPanel',
	title: 'Basic Geo',
	closable: true,
	
	requires: [
		'App.util.d3.geo.Us',
		'App.util.MessageBus'
	],
	
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
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki',
 			me.width = 
 				parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
 			me.height = 
	 			parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
	 		me.mapRenderedEvent = 'geoBasicRendered',
	 		me.map = Ext.create('App.util.d3.geo.Us', {
		 		fill: '#FFFFFF',
		 		mapRenderedEvent: me.mapRenderedEvent
		 	}, me);
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>Basic Geo</b>';
		
		/**
 		 * @listener
 		 * @description On activate, publish update to the "info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		/**
 		 * @listener
 		 * @description After rendering, initialize the map and execute
 		 * other drawing functionality
 		 */
 		me.on('afterrender', me.initCanvas, me);
 		
 		/**
  		 * @listener
  		 * @description After the map template has been, execute the overlay functionality
  		 */
  		me.eventRelay.subscribe(me.mapRenderedEvent, me.overlay, me);

 		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @description Initialize the canvas, map, etc.
 	 */
 	initCanvas: function(panel) {
	 	var me = this;
	 	
		me.canvasWidth = parseInt(me.width * .95);
		me.canvasHeight = parseInt(me.height * .95);
		me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
		me.svgInitialized = true;
		
		// set map properties
		me.map.setSvg(me.svg);
		me.map.setCanvasDimensions(me.canvasWidth, me.canvasHeight);
		me.map.draw();
	},
	
	overlay: function() {
		var me = this;
		
		me.svg.selectAll('circle')
			.data([100, 200, 300])
			.enter()
			.append('circle')
			.attr('cx', function(d) {
				return d;
			})
			.attr('cy', function(d) {
				return d;
			})
			.attr('r', 5)
			.style('fill', 'red');
	}
	
	/*
svg.selectAll('path')
				.data(json.features)
				.enter()
				.append('path')
				.attr('d', path)
				.style('fill', fill)
				.style('stroke', stroke)
				.style('stroke-width', strokeWidth)
				.on('mouseover', function(d) {
				
					d3.select(this)
						.style('fill', function(d) {
							return mouseOverFill;
						});
				})
				.on('mouseout', function(d) {
					
					d3.select(this)
						.style('fill', fill);
				});*/
});