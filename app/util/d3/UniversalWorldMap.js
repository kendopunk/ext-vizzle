/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Configurable world map class
 */
Ext.define('App.util.d3.UniversalWorldMap', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	canvasHeight: 500,
	canvasWidth: 500,
	centered: null,
	chartInitialized: false,
	countryDefaults: {
		fill: '#BBB',
		stroke: 'none',
		strokeWidth: 1,
		strokeOver: 'white'
	},
	gPath: null,
	graticule: d3.geo.graticule(),
	path: null,
	projection: null,
	tooltipFunction: function(d, i) { return 'country'; },
	topo: null,
	topoUrl: 'data/geo/world-topo-min.json',
	zoom: null,
	
	/**
 	 * constructor
 	 */
	constructor: function(config) {
		var me = this;
		Ext.merge(me, config);
	},
	
	initChart: function() {
		var me = this;
		
		me.projection = d3.geo.mercator()
			.translate([me.canvasWidth/2, me.canvasHeight/2])
			.scale(me.canvasWidth / 2 / Math.PI);
		
		me.path = d3.geo.path().projection(me.projection);
		
		me.gPath = me.svg.append('svg:g');
		
		me.zoom = d3.behavior.zoom()
			.scaleExtent([1, 9])
			.on('zoom', me.zoomHandler);
			
			me.svg.call(me.zoom);
		
		Ext.Ajax.request({
			url: me.topoUrl,
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				
				me.topo = topojson.feature(resp, resp.objects.countries).features;
				
				
				
			},
			callback: function() {
				me.renderMap();
			},
			scope: me
		});
				
		
		
			
		
	},
	
	renderMap: function() {
		var me = this;
		
		me.gPath.append('path')
			.datum(me.gPathraticule)
			.attr('class', 'graticule')
			.attr('d', me.path);
			
		me.gPath.append('path')
			.datum({
				type: 'LineString',
				coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
			})
			.attr('class', 'equator')
			.attr('d', me.path);
			
		var countrySelection = me.gPath.selectAll('.country')
			.data(me.topo);
		
		countrySelection.enter()
			.append('path')
			.attr('class', 'country')
			.attr('d', me.path)
			.attr('id', function(d, i) {
				return d.id;
			})
			.style('fill', me.countryDefaults.fill)
			.style('stroke', me.countryDefaults.stroke)
			.style('stroke-width', me.countryDefaults.strokeWidth)
			.on('mouseover', function(d, i) {
				d3.select(this)
					.style('stroke', me.countryDefaults.strokeOver);
			})
			.on('mouseout', function(d, i) {
				d3.select(this)
					.style('stroke', me.countryDefaults.stroke);
			});
			//.on('dblclick', me.dblClickHandler);
		
		countrySelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	
	
	},
	
	zoomHandler: function() {
		var me = this;
		
		var t = d3.event.translate,
			s = d3.event.scale,
			zscale = s,
			h = Math.floor(me.canvasHeight/4),
			width = me.canvasWidth,
			height = me.canvasHeight;
		
		t[0] = Math.min(
			(width/height) * (s - 1), 
			Math.max(width * (1-s), t[0])
		);
		t[1] = Math.min(
			h * (s-1) + h * s,
			Math.max(height  * (1-s) - h * s, t[1])
		);
		
		// these are out of scope
		//me.zoom.translate(t);
		
		//me.gPath.attr('transform', 'translate(' + t  + ')scale(' + s + ')');
	}
});