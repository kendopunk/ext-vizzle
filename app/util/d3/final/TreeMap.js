/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3.final
 * @description Treemap class
 */
Ext.define('App.util.d3.final.TreeMap', {

	panelId: null,
	treemap: null,
	rootDiv: null,
	svg: null,
	gTitle: null,
	
	divClass: 'treecell',
	
	canvasWidth: 500,
	canvasHeight: 500,
	colorScale: d3.scale.category20c(),
	colorDefinedInData: false,
	colorDefinedInDataIndex: 'color',
	fixedColorRange: [],
	fixedColorScale: null,
	sizeMetric: 'value',
	colorMetric: 'value',	// only necessary if fixeColorRange is defined
	/** margins required **/
	margins: {
		top: 20,
		left: 10
	},
	graphData: [],
	sticky: true,
	treemapValueFunction: function(d) {
		return 'value';
	},
	textFunction: function(d, i) {
		return d.children ? null : 'text';
	},
	cellTranslationFunction: function() {
		
		this.style('visibility', function(d) {
			if(d.value <= 0) {
				return 'hidden';
			}
			return 'visible';
		})
		.style('left', function(d) {
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
			if(d.value <= 0) {
				return '0px';
			}
			return d.dx - 1 + 'px';
		})
		.style('height', function(d) {
			if(d.value <= 0) {
				return '0px';
			}
			return d.dy - 1 + 'px';
		})
	},
	
	/**
 	 * CONSTRUCTOR
 	 */
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		var sizeMetric = me.sizeMetric,
			colorMetric = me.colorMetric;
		
		// init svg
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.margins.top);
			
		// init treemap
		me.treemap = d3.layout.treemap()
			.size([me.canvasWidth, me.canvasHeight])
			.sticky(me.sticky)
			.value(function(d) { return d[sizeMetric];});
		
		// init the root "<div>"
		me.rootDiv = d3.select(me.panelId)
			 .append('div')
			 .style('position', 'relative')
			 .style('width', me.canvasWidth)
			 .style('height', me.canvasHeight);
			 
		// add margins object to every data element
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

		me.rootDiv.data([graphData])
		 	.selectAll('div')
		 	.data(me.treemap.nodes)
		 	.enter()
		 	.append('div')
		 	.attr('class', me.divClass)
		 	.attr('marginTop', me.margins.top)
		 	.attr('marginLeft', me.margins.left)
		 	.style('background', function(d, i) {
		 		if(colorDefinedInData) {
			 		return d.children ? null : d[colorDefinedInDataIndex];
		 		} else if(fixedColorScale != null) {
		 			return d.children ? null : fixedColorScale(d[colorMetric]);
		 		} else {
			 		return d.children ? null : colorScale();
			 	}
			})
			.call(me.cellTranslationFunction)
			.text(me.textFunction);
			
		me.handleTitle();
	},
	
	/**
 	 * @function
 	 * @description Transition the treemap based on a new metric
 	 * TODO - exit().remove() for data count change
 	 */
	transition: function() {
		var me = this;
		
		var sizeMetric = me.sizeMetric,
			colorMetric = me.colorMetric,
			colorScale = me.colorScale,
			colorDefinedInData = me.colorDefinedInData,
			colorDefinedInDataIndex = me.colorDefinedInDataIndex,
			fixedColorScale = null;
			
		// change the fixed color scale ??
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
				
			fixedColorScale = me.fixedColorScale;
		}
		
		me.rootDiv.selectAll('div')
			.data(me.treemap.value(function(d) {return d[sizeMetric];}))
			.style('background', function(d, i) {
				if(colorDefinedInData) {
			 		return d.children ? null : d[colorDefinedInDataIndex];
		 		} else if(fixedColorScale != null) {
		 			return d.children ? null : fixedColorScale(d[colorMetric]);
		 		} else {
			 		return d.children ? null : colorScale(i);
			 	}
			})
			.transition()
			.duration(1500)
			.call(me.cellTranslationFunction)
			.text(me.textFunction);

		
		me.handleTitle();
	},
	
	/**
 	 * @function
 	 * @description Handle the title in the lone SVG element
 	 */
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
	
	/**
	 *
	 *
	 *
	 * SETTERS
	 *
	 *
	 *
	 */
	setSizeMetric: function(metric) {
		var me = this;
		
		me.sizeMetric = metric;
	},
	
	setColorMetric: function(metric) {
		var me = this;
		
		me.colorMetric = metric;
	},
	
	setTextFunction: function(fn) {
		var me = this;
		
		me.textFunction = fn;
	},
	
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	setSticky: function(st) {
		var me = this;
		
		me.sticky = st;
	}
});