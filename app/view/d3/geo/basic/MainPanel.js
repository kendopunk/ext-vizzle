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
		'App.util.MessageBus'
	],
	
	initComponent: function() {
		var me = this;
		
		me.eventRelay = Ext.create('App.util.MessageBus')
		
		// chart description for info panel
		me.chartDescription = '<b>Basic Geo</b>';
			
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		me.on('afterrender', me.draw, me);
		
		/*Ext.EventManager.onWindowResize(function(w, h) {
			console.log(w + ' x ' + h);
			me.setWidth(400);
			me.setHeight(400);
		}, me);*/
		
		/*me.on('resize', function(panel, w, h, eOpts) {
			console.log('panel resized');
		
			me.svg.attr('width', 400)
				.attr('height', 400);
		
		
		
		
		});*/
		
		me.callParent(arguments);
	},
	
	draw: function(panel) {
		
		var me = this;
		
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.canvasWidth = parseInt(me.width * .95);
		me.canvasHeight = parseInt(me.height * .95);
		me.panelId = '#' + me.body.id;
	 	
	 	// init svg
	 	me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight)
	 		.attr('preserveAspectRatio', 'none');
	 		//.attr('viewBox', '0,0,300,300');
	 	
	 	// define map projection
	 	var projection = d3.geo.albersUsa()
		 	.translate([
			 	me.canvasWidth/2,
			 	me.canvasHeight/2
			])
			.scale([750]);

		// define path generator
		var path = d3.geo.path()
			.projection(projection);
			
		var svg = me.svg;
			

		// load in JSON data
		d3.json('data/geo_us.json', function(json) {
		
			// Bind data and create one path per GeoJSON feature
			svg.selectAll('path')
				.data(json.features)
				.enter()
				.append('path')
				.attr('d', path)
				.style('fill', '#FFCC33')
				.style('stroke', 'black')
				.style('stroke-width', 0.5)
				/*.on('mouseover', function(d) {
					svg.attr('viewBox', '0,0,300,300');
				})
				.on('mouseout', function(d) {
					svg.attr('viewBox', '0, 0, ' + me.canvasWidth + ',' + me.canvasHeight);
				});*/
				.on('mouseover', function(d) {
				
					d3.select(this)
						.style('opacity', .6)
						.style('fill', function(d) {
							if(d.properties.name == 'Ohio') {
								return '#000000';
							}
							return '#CC3300';
						
						});
				
					//console.log(Ext.encode(a));
				})
				.on('mouseout', function(d) {
					d3.select(this)
						.style('opacity', 1)
						.style('fill', '#FFCC33');
				});
			
			// dayton
			var long = 39.759444;
			var lat = -84.191667;
			var coordinates = projection([lat, long]);
			
			// try a circle
			svg.selectAll('circle')
				.data([1])
				.enter()
				.append('circle')
				.attr('cx', coordinates[0])
				.attr('cy', coordinates[1])
				.attr('r', 5)
				.style('fill', '#990066');
				
			/*Ext.each(json.features, function(item, index) {
				console.log(item.properties.name);
				console.log(index);
				console.log('-------');
			});*/
				
			/*Ext.each(path, function(item, index, all) {
				console.debug(path(index));
			});*/
			
			
			
		});
	}
});