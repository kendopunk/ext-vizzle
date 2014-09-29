/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Treemap class
 */
Ext.define('App.util.d3.UniversalTreeMap', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	canvasHeight: 400,
	canvasWidth: 400,
	cellTranslationFunction: function() {
		this.style('visibility', function(d) {
			return d.value <= 0 ? 'hidden' : 'visible';
		})
		.style('left', function(d) {
			if(d.parent !== undefined) {
				if(d.parent.margins !== undefined) {
					return d.x + d.parent.margins.left + 'px';
				}
				return d.x + d.parent.parent.margins.left + 'px';
			}
			return d.x + d.margins.left + 'px';
		})
		.style('top', function(d) {
			if(d.parent !== undefined) {
				if(d.parent.margins !== undefined) {
					return d.y + Math.floor(d.parent.margins.top/2) + 'px';
				}
				return d.y + Math.floor(d.parent.parent.margins.top/2) + 'px';
			}
			return d.y + d.margins.top + 'px';
		})
		.style('width', function(d) {
			return d.value <= 0 ? '0px' : d.dx - 1 + 'px';
		})
		.style('height', function(d) {
			return d.value <=0 ? '0px' : d.dy -1 + 'px';
		})
	},
	chartInitialized: false,
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	colorMetric: 'value',	// only necessary if fixedColorRange is defined
	colorScale: d3.scale.category20c(),
	dataRebind: false,
	divClass: 'treecell',
	
	fixedColorRange: [],
	fixedColorScale: null,
	graphData: [],
	
	gTitle: null,
	
	margins: {
		top: 20,
		left: 10
	},
	
	panelId: null,
	rootDiv: null,
	showTooltips: false,
	sizeMetric: 'value',
	sticky: true,
	textFunction: function(d, i) {
		return d.children ? null : 'text';
	},
	tooltipFunction: function(d, i) {
		return 'tooltip';
	},
	treemap: null,
	treemapValueFunction: function(d) {
		return 'value';
	},
	
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
		var me =this;
		
		var sizeMetric = me.sizeMetric;
		
		// init svg
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.margins.top);
			
		// init treemap
		me.treemap = d3.layout.treemap()
			.size([me.canvasWidth, me.canvasHeight])
			.sticky(me.sticky)
			.value(function(d) {
				return d[sizeMetric];
			});
		
		// init the root <div>
		me.rootDiv = d3.select(me.panelId)
			 .append('div')
			 .style('position', 'relative')
			 .style('width', me.canvasWidth)
			 .style('height', me.canvasHeight);
		
		me.gTitle = me.svg.append('svg:g')
				.attr('transform', 'translate('
				+ parseInt(me.canvasWidth/2)
				+ ', 15)');
		
		me.chartInitialized = true;
		
		return me;
	},
	
	/**
 	 * @function
 	 * @description Draw the initial tree map
 	 */
	draw: function() {
		var me = this;
		
		var graphData = me.graphData,
			treemapValueFunction = me.treemapValueFunction,
			colorScale = me.colorScale,
			colorDefinedInData = me.colorDefinedInData,
			colorDefinedInDataIndex = me.colorDefinedInDataIndex,
			fixedColorScale = me.fixedColorScale,
			sizeMetric = me.sizeMetric,
			colorMetric = me.colorMetric;
			
		// for adding margins to each element
		me.graphData.margins = me.margins;
			
		// ordinal color scale
		if(me.fixedColorRange.length > 0) {
			me.fixedColorScale = d3.scale.linear()
				.domain([
					d3.min(me.graphData.children, function(d) {
						return d[colorMetric];
					}),
					d3.max(me.graphData.children, function(d) {
						return d[colorMetric];
					})
				])
				.range(me.fixedColorRange);
		}
		
		////////////////////////////////////////
		// handlers
		////////////////////////////////////////
		me.handleRootDiv();
		me.handleChartTitle();
	},
	
	/**
	 * @function
	 * @description Handle root <div>...JRAT
	 * Handles binding/rebinding or sticky translation
	 */
	handleRootDiv: function() {
		var me = this;
		
		var colorDefinedInData = me.colorDefinedInData,
			colorDefinedInDataIndex = me.colorDefinedInDataIndex,
			fixedColorScale = me.fixedColorScale,
			colorScale = me.colorScale,
			colorMetric = me.colorMetric,
			sizeMetric = me.sizeMetric;
			
		var divCount = me.rootDiv.selectAll('div')[0].length;
		
		if(divCount == 0 || me.dataRebind) {
			var rdSelector = me.rootDiv.data([me.graphData])
			.selectAll('div')
			.data(me.treemap.nodes);
			
			me.dataRebind = false;
		} else {
			var rdSelector = me.rootDiv.selectAll('div')
				.data(me.treemap.value(function(d) {
					return d[sizeMetric];
				}));
		}
			
		rdSelector.exit().remove();
		
		rdSelector.enter()
			.append('div')
			.attr('class', me.divClass)
			.attr('marginTop', me.margins.top)
		 	.attr('marginLeft', me.margins.left)
		 	.attr('applyTip', function(d, i) {
			 	if(!d.children) { return 'yes'; }
		 	});
		 	
		rdSelector.style('background', function(d, i) {
				if(colorDefinedInData) {
			 		return d.children ? null : d[colorDefinedInDataIndex];
		 		} else if(fixedColorScale != null) {
		 			return d.children ? null : fixedColorScale(d[colorMetric]);
		 		} else {
			 		return d.children ? null : colorScale(i);
			 	}
			});
			
		rdSelector.transition()
			.duration(1000)
			.call(me.cellTranslationFunction)
			.text(me.textFunction);
			
		if(me.showTooltips) {
			me.rootDiv.selectAll('[applyTip=yes]')
				.call(d3.helper.tooltip().text(me.tooltipFunction));
		}
	},
	
	
	/**
 	 * @function
 	 * @description Handle the title in the lone SVG element
 	 */
	handleChartTitle: function() {
 		var me = this;
 		
 		me.gTitle.selectAll('text').remove();
 		
 		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	},
	
	/**
	 *
	 * SETTERS
	 *
	 */
	setChartTitle: function(title) {
		var me = this;
		me.chartTitle = title;
	},
	
	setColorMetric: function(metric) {
		var me = this;
		me.colorMetric = metric;
	},
	
	setGraphData: function(d) {
		var me = this;
		me.graphData = d;
		me.dataRebind = true;
	},
	
	setSizeMetric: function(metric) {
		var me = this;
		me.sizeMetric = metric;
	},
	
	setSticky: function(st) {
		var me = this;
		me.sticky = st;
	},
	
	setTextFunction: function(fn) {
		var me = this;
		me.textFunction = fn;
	}
});