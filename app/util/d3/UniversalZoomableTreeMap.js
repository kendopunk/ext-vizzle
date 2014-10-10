/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Zoomable treemap class
 */
Ext.define('App.util.d3.UniversalZoomableTreeMap', {

	panelId: null,
	
	canvasHeight: 400,
	canvasWidth: 400,
	chartInitialized: false,
	chartTitle: null,
	cellSelection: null,
	colorScale: null,
	defaults: {
		opacity: {
			over: 1,
			out: .8
		}
	},
	defs: null,
	dyTextThreshold: 15,
	filter: null,
	gPrimary: null,
	gTitle: null,
	labelClass: 'labelText',
	margins: {
		top: 30,
		left: 15
	},
	nodes: null,
	sectionLabelClass: 'treemapCategory',
	showLabels: true,
	showTooltips: true,
	svg: null,
	transitionDuration: 500,
	textFunction: function(d, i) {
		return 'text';
	},
	tooltipFunction: function(d, i) {
		return 'tooltip';
	},
	treemap: null,
	valueMetric: 'value',
	xScale: d3.scale.linear().range([0, 400]),
	xScaleFactor: 1,
	yScale: d3.scale.linear().range([0, 400]),
	yScaleFactor: 1,
	zoomed: false,	// flag
	
	// constructor
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
	},
	
	/**
	 * @function
	 * @description Initialize chart components
	 */
	initChart: function() {
		var me = this;
		
		////////////////////////////////////////
		// local scope
		////////////////////////////////////////
		var valueMetric = me.valueMetric;
		
		////////////////////////////////////////
		// apply scaling factor
		////////////////////////////////////////
		me.canvasWidth = Math.floor(me.canvasWidth * me.xScaleFactor);
		me.canvasHeight = Math.floor(me.canvasHeight * me.yScaleFactor);
		
		////////////////////////////////////////
		// set scales
		////////////////////////////////////////
		me.xScale = d3.scale.linear().range([0, me.canvasWidth]);
		me.yScale = d3.scale.linear().range([0, me.canvasHeight]);
		
		me.treemap = d3.layout.treemap()
			.round(false)
			.size([
				me.canvasWidth - me.margins.left,
				me.canvasHeight - me.margins.top
			])
			.sticky(false)
			.value(function(d) {
				return d[valueMetric];
			});
			
		me.svg = d3.select(me.panelId)
			.append('svg:svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
			
		me.gPrimary = me.svg.append('svg:g')
			.attr('transform', 'translate(' + me.margins.left + ',' + me.margins.top + ')');
		
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
				+ parseInt(me.canvasWidth/2)
				+ ','
				+ parseInt(me.margins.top/2)
				+ ')'
			);
			
		me.initDefs();
			
		me.chartInitialized = true;
		
		return me;
	},
	
	/**
	 * @function
	 * @description Bind/rebind data and draw the treemap
	 */
	draw: function() {
		var me = this;
		
		me.nodes = me.treemap.nodes(me.graphData)
			.filter(function(d) {
				return !d.children;
			});
		
		////////////////////////////////////////
		// handlers
		// - cells
		// - rectangles
		// - labels
		////////////////////////////////////////
		me.handleCells();
		me.handleRects();
		me.handleRectLabels();
		me.handleSectionLabels();
		me.handleChartTitle();
	},
	
	/**
	 * @function
	 * @description Handle the container cell <g> elements
	 */
	handleCells: function() {
		var me = this;
		
		////////////////////////////////////////
		// <g> element - JRAT
		////////////////////////////////////////
		me.cellSelection = me.gPrimary.selectAll('g.cell')
			.data(me.nodes);
			
		me.cellSelection.exit().remove();
		
		me.cellSelection.enter()
			.append('g')
			.attr('class', 'cell');
			
		me.cellSelection.transition()
			.duration(me.transitionDuration)
			.attr('transform', function(d, i) {
				var temp = d.y + 7;
				return 'translate(' + d.x + ',' + temp + ')';
			});
	},
	
	/**
	 * @function
	 * @description Draw/redraw the rectangles
	 */
	handleRects: function() {
		var me = this;
		
		var rectSelection = me.cellSelection.selectAll('rect')
			.data(function(d) {return [d]; });
			
		rectSelection.enter()
			.append('rect')
			.style('opacity', me.defaults.opacity.out)
			//.attr('filter', 'url(#def_' + me.panelId + ')')
			.on('mouseover', function(d) {
				d3.select(this)
					.style('opacity', me.defaults.opacity.over)
					.style('stroke', 'black')
					.style('stroke-width', 1);
			})
			.on('mouseout', function(d) {
				d3.select(this)
					.style('opacity', me.defaults.opacity.out)
					.style('stroke', 'none')
					.style('stroke-width', 0);
			})
			.on('click', function(d) {
				me.zoom(d);
			})
			.on('dblclick', function(d) {
				me.zoom(null);
			});
			
		rectSelection.transition()
			.duration(me.transitionDuration)
			.attr('width', function(d) {
				return d.dx - 1;
			})
			.attr('height', function(d) {
				return d.dy - 1;
			})
			.style('fill', function(d, i) {
				return d.color;
			});
			
		if(me.showTooltips) {
			rectSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
		}
	},
	
	/**
	 * @function
	 * @description Handle display of rectangle labels
	 */
	handleRectLabels: function() {
		var me = this;
		
		if(!me.showLabels) {
			me.cellSelection.selectAll('text.' + me.labelClass)
				.transition()
				.duration(250)
				.style('opacity', 0)
				.remove();
		} else {
			// labels - JRAT
			var textSelection = me.cellSelection.selectAll('text.' + me.labelClass)
				.data(function(d) { return [d]; });
				
			textSelection.enter()
				.append('text')
				.attr('dy', '.35em')
				.attr('class', me.labelClass)
				.attr('text-anchor', 'middle')
				.attr('ctl', 0)
				.style('opacity', 0);
				
			textSelection.transition()
				.duration(me.transitionDuration)
				.attr('x', function(d) {
					return d.dx/2; 
				})
				.attr('y', function(d) {
					return d.dy/2;
				})
				.text(me.textFunction)
				.transition()
				.each('end', function() {
					// get computed text length
					var ctl = d3.select(this).node().getComputedTextLength();
					
					// hide in small rects
					d3.select(this)
						.transition()
						.style('opacity', function(d) {
							if(d.dx > ctl) {
								return d.dy > me.dyTextThreshold ? 1 : 0;
							}
							return 0;
						});
				});
		}
	},
	
	/**
	 * @function
	 * @description Handle section labels
	 */
	handleSectionLabels: function() {
		var me = this;
		
		////////////////////////////////////////
		// get unique parents
		////////////////////////////////////////
		var uniqueParents = Ext.Array.unique(Ext.Array.pluck(me.nodes, 'parent'));
		
		////////////////////////////////////////
		// section title - JRAT
		////////////////////////////////////////
		var catSelection = me.gPrimary.selectAll('text.' + me.sectionLabelClass)
			.data(uniqueParents);
			
		catSelection.exit().remove();
		
		catSelection.enter()
			.append('text')
			.attr('class', me.sectionLabelClass)
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle');
			
		catSelection.transition()
			.duration(me.transitionDuration)
			.text(function(d) {
				return d.name;
			})
			.attr('x', function(d) {
				return d.x + (d.dx/2);
			})
			.attr('y', function(d) {
				// yPos + (yExtent - 20)
				return d.y + (d.dy - 20);
			});
	},
	
	/**
 	 * @function
 	 * @description Zoom handler
 	 * @param dataObject Object
 	 */
 	zoom: function(dataObject) {
	 	var me = this,
		 	d = null;
		 	
	 	if(dataObject == null) {
		 	d = me.graphData;
		 	me.zoomed = false;
		} else {
			d = dataObject.parent;
			me.zoomed = true;
		}
		
		////////////////////////////////////////
		// local scope
		////////////////////////////////////////
		var xScale = me.xScale,
			yScale = me.yScale;
		
		////////////////////////////////////////
		// adjust X/Y scales
		////////////////////////////////////////
		xScale.domain([d.x, d.x + d.dx]);
		yScale.domain([d.y, d.y + d.dy]);
		
		////////////////////////////////////////
		// zooming vars
		////////////////////////////////////////
		var kx = me.canvasWidth / d.dx,
			ky = me.canvasHeight / d.dy;
		
		var t = me.gPrimary.selectAll('g.cell')
			.transition()
			.duration(me.transitionDuration)
			.attr('transform', function(d) {
				return 'translate(' + xScale(d.x) + ',' + yScale(d.y) + ')';
			});
		
		// rect zoom
		t.select('rect')
			.attr('width', function(d) {
				return kx * d.dx - 1; 
			})
			.attr('height', function(d) {
				return ky * d.dy - 1;
			});
			
		// text zoom
		// old opacity function = //return kx * d.dx > d.w ? 1 : 0;
		t.select('text')
			.attr('x', function(d) {
				return kx * d.dx / 2;
			})
			.attr('y', function(d) {
				return ky * d.dy / 2;
			})
			.each('end', function() {
				// get computed text length
				var ctl = d3.select(this).node().getComputedTextLength();
				
				// hide in small rects
				d3.select(this)
					.style('opacity', function(d) {
						if((kx * d.dx) > ctl) {
							return d.dy > me.dyTextThreshold ? 1 : 0;
						}
						return 0;
					});
			});
			
		// category label zoom or reset
		if(dataObject !== null) {
			var c = me.gPrimary.selectAll('text.' + me.sectionLabelClass)
				.transition()
				.duration(me.transitionDuration)
				.attr('x', function(d) {
					return d.parent.x + (d.parent.dx/2);
				})
				.attr('y', function(d) {
					// yPos + (yExtent - 20)
					return d.parent.y + (d.parent.dy - 20);
				})
				.style('opacity', function(d) {
					return d.name == dataObject.parent.name ? 1 : 0;
				});
		} else {
			var c = me.gPrimary.selectAll('text.' + me.sectionLabelClass)
				.transition()
				.duration(me.transitionDuration)
				.attr('x', function(d) {
					return d.x + (d.dx/2);
				})
				.attr('y', function(d) {
					// yPos + (yExtent - 20)
					return d.y + (d.dy - 20);
				})
				.style('opacity', 1);
		}
	},
	
	/**
 	 * @function
 	 * @description Draw/transition the chart title
 	 */
	handleChartTitle: function() {
		var me = this;
		
		me.gTitle.selectAll('text').remove();
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#333333')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	},
	
	initDefs: function() {
		var me = this;
		
		me.defs = me.svg.append('defs');
		
		me.filter = me.defs.append('filter')
			.attr('id', 'def_' + me.panelId)
			.attr('x', '-30%')
			.attr('y', '-30%')
			.attr('height', '200%')
			.attr('width', '200%');
		
		// append Gaussian blur to filter
		me.filter.append('feGaussianBlur')
			.attr('in', 'SourceAlpha')
			.attr('stdDeviation', 2) // !!! important parameter - blur
			.attr('result', 'blur');
			
		// append offset filter to result of Gaussian blur filter
		me.filter.append('feOffset')
			.attr('in', 'blur')
			.attr('dx', 1) // !!! important parameter - x-offset
			.attr('dy', 1) // !!! important parameter - y-offset
			.attr('result', 'offsetBlur');
			
		// merge result with original image
		var feMerge = me.filter.append('feMerge');
		
		// first layer result of blur and offset
		feMerge.append('feMergeNode')
			.attr('in", "offsetBlur');
			
		// original image on top
		feMerge.append('feMergeNode')
			.attr('in', 'SourceGraphic');
	},
	
	/**
	 *
	 * SETTERS
	 *
	 */
	isZoomed: function() {
		return this.zoomed;
	},
	
	setChartTitle: function(t) {
		var me = this;
		me.chartTitle = t;
	},
		
	setGraphData: function(dat) {
		var me = this;
		me.graphData = dat;
		
		return me;
	},
	
	setShowLabels: function(bool) {
		var me = this;
		me.showLabels = bool;
	}
});