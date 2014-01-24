/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.geo
 * @description Base US map class
 */
Ext.define('App.util.d3.geo.Us', {
	extend: 'Object',
	
	requires: [
		'App.util.MessageBus'
	],
	
	svg: null,
	canvasWidth: 500,
	canvasHeight: 300,
	projection: null,
	path: null,
	fill: '#FFCC33',
	mouseOverFill: '#BADCDC',
	stroke: '#333333',
	strokeWidth: 0.5,
	mapScale: 1000,
	mapRenderedEvent: null,
	translateOffsetX: 0,
	translateOffsetY: 0,
	
	constructor: function(config) {
		var me = this;
		
		me.eventRelay = Ext.create('App.util.MessageBus');
		
		Ext.apply(me, config);
	},
	
	/**
 	 * @function
 	 * @description Draw the map
 	 */
	draw: function() {
		var me = this;
		
		// define map projection
		me.projection = d3.geo.albersUsa()
			.translate([
				(me.canvasWidth/2) + me.translateOffsetX,
				(me.canvasHeight/2) + me.translateOffsetY
			])
			.scale([me.mapScale]);
			
		// define path generator
		me.path = d3.geo.path()
			.projection(me.projection);
			
		// local scope
		var svg = me.svg,
			path = me.path,
			stroke = me.stroke,
			fill = me.fill,
			strokeWidth = me.strokeWidth,
			mouseOverFill = me.mouseOverFill,
			eventRelay = me.eventRelay,
			mapRenderedEvent = me.mapRenderedEvent;
			
		// load in JSON data
		d3.json('data/geo_us.json', function(json) {
		
			// Bind data and create one path per GeoJSON feature
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
				});
				
			// eventing
			if(mapRenderedEvent != null) {
				eventRelay.publish(mapRenderedEvent, true);
			}
		});
	},
	
	/**
	 *
	 *
	 * GETTERS
	 *
	 *
	 */
	getMapCoords: function(long, lat) {
		var me = this;
		
		return me.projection([long, lat]);
	},
	
	/**
 	 *
 	 *
 	 * SETTERS
 	 *
 	 *
 	 */
 	 
 	setSvg: function(s) {
	 	var me = this;
	 	me.svg = s;
	},
	
	setCanvasDimensions: function(w, h) {
		var me = this;
		
		me.canvasWidth = w;
		me.canvasHeight = h;
	}
});