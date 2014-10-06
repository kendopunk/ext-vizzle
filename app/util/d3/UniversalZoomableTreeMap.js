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
	cellSelection: null,
	colorScale: null,
	defaults: {
		opacity: {
			over: 1,
			out: .8
		}
	},
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
			.size([me.canvasWidth, me.canvasHeight])
			.sticky(false)
			.value(function(d) {
				return d[valueMetric];
			});
			
		me.svg = d3.select(me.panelId)
			/*.append('div')
			.style('width', me.canvasWidth + 'px')
			.style('height', me.canvasHeight + 'px')*/
				.append('svg:svg')
				.attr('width', me.canvasWidth)
				.attr('height', me.canvasHeight)
					.append('svg:g')
					.attr('transform', 'translate(' + me.margins.left + ',' + me.margins.top + ')');
		/*
		// selection in window zooms out (interference by button clicks in toolbars)
		d3.select(window).on('click', function() {
			me.zoom(null);
		}, me);
		*/
		
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
		me.cellSelection = me.svg.selectAll('g.cell')
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
				.attr('text-anchor', 'middle');
				
			textSelection.transition()
				.duration(me.transitionDuration)
				.attr('x', function(d) {
					return d.dx/2; 
				})
				.attr('y', function(d) {
					return d.dy/2;
				})
				.text(me.textFunction)
				.style('opacity', function(d) {		
					// hide text in small rects
					d.w = this.getComputedTextLength();
					if(d.dx > d.w) {
						return d.dy < 10 ? 0 : 1;
					}
					return 0;
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
		var catSelection = me.svg.selectAll('text.' + me.sectionLabelClass)
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
				return d.dx/2;
			})
			.attr('y', function(d) {
				return d.dy/2;
			})
			.attr('transform', function(d) {
				return 'translate(' + d.x + ',' + d.y + ')';
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
		} else {
			d = dataObject.parent;
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
		
		var t = me.svg.selectAll('g.cell')
			.transition()
			.duration(me.transitionDuration)
			.attr('transform', function(d) {
				return 'translate(' + xScale(d.x) + ',' + yScale(d.y) + ')';
			});
			
		t.select('rect')
			.attr('width', function(d) {
				return kx * d.dx - 1; 
			})
			.attr('height', function(d) {
				return ky * d.dy - 1;
			});
		
		t.select('text')
			.attr('x', function(d) {
				return kx * d.dx / 2;
			})
			.attr('y', function(d) {
				return ky * d.dy / 2;
			})
			.style('opacity', function(d) {
				if(kx * d.dx > d.w) {
					return ky * d.dy < 10 ? 0 : 1;
				} else {
					return 0;
				}
				//return kx * d.dx > d.w ? 1 : 0;
			});
	},
	
	/**
	 *
	 * SETTERS
	 *
	 */
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