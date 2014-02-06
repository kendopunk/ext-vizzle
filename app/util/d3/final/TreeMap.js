/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Treemap class
 */
Ext.define('App.util.d3.final.TreeMap', {

	panelId: null,
	treemap: null,
	
	canvasWidth: 500,
	canvasHeight: 500,
	
	colorScale: d3.scale.category20c(),
	
	svg: null,
	gTitle: null,
	rootDiv: null,
	
	margins: {
		top: 20,
		left: 10
	},
	
	graphData: [],
	
	treemapValueFunction: function(d) {
		return 'value';
	},
	
	textFunction: function(d, i) {
		return d.children ? null : 'text';
	},
	
	cellTranslationFunction: function() {
		
		this.style('left', function(d) {
			if(d.parent !== undefined) {
				return d.x + d.parent.margins.left + 'px';
			}
			return d.x + d.margins.left + 'px';
		})
		.style('top', function(d) {
			if(d.parent !== undefined) {
				return d.y + Math.floor(d.parent.margins.top/2) + 'px';
			}
			return d.y + d.margins.top + 'px';
		})
		.style('width', function(d) {
			return d.dx - 1 + 'px';
		})
		.style('height', function(d) {
			return d.dy - 1 + 'px';
		});
	},
	
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		// init svg
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.margins.top);
			
		// init treemap
		me.treemap = d3.layout.treemap()
			.size([me.canvasWidth, me.canvasHeight])
			.sticky(true)
			.value(function(d) {
				return d.sbwins;
			});
		
		// init the root "<div>"
		me.rootDiv = d3.select(me.panelId)
			 .append('div')
			 .style('position', 'relative')
			 .style('width', me.canvasWidth)
			 .style('height', me.canvasHeight);
			 
		// add margins object to every data element
		me.graphData.margins = me.margins;
	},
	
	draw: function() {
		var me = this;
		
		var graphData = me.graphData,
			treemapValueFunction = me.treemapValueFunction,
			colorScale = me.colorScale;
			
		me.rootDiv.data([graphData])
		 	.selectAll('div')
		 	.data(me.treemap.nodes)
		 	.enter()
		 	.append('div')
		 	.attr('class', 'treepanelCell')
		 	.attr('marginTop', me.margins.top)
		 	.attr('marginLeft', me.margins.left)
		 	.style('background', function(d, i) {
			 	return d.children ? null : colorScale(i);
			})
			.call(me.cellTranslationFunction)
			.text(me.textFunction);
			
		me.handleTitle();
	},
	
	transition: function() {
		var me = this;
		
		me.rootDiv.selectAll('div')
			.data(me.treemap.value(function(d) { return d.avgpts; }))
			.transition()
			.duration(1500)
			.call(me.cellTranslationFunction);
		
		me.handleTitle();
	},
	
	handleTitle: function() {
		var me = this;
		
		if(me.gTitle == null) {
			me.gTitle = me.svg.append('svg:g')
				.attr('transform', 'translate(15, 15)');
				
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(String);
		} else {
			me.gTitle.selectAll('text')
				.text(me.chartTitle);
		}
	},
	
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
		
		return;
	}
});