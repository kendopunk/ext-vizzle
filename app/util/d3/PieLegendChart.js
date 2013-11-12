/**
 * @class
 * @memberOf App.util.d3
 * @description Extended pie chart class to include legend
 * @extend App.util.d3.PieChart
 */
Ext.define('App.util.d3.PieLegendChart', {
	extend: 'App.util.d3.PieChart',
	
	/**
	 * The "g" element to hold the legend
	 */
	gLegend: null,
	
	/**
 	 * chart and legend flex default values
 	 */
 	chartFlex: 3,
 	legendFlex: 1,
 	
 	/**
  	 * height and width of legend colored rects
  	 */
  	legendSquareWidth: 10,
  	legendSquareHeight: 10,
  	
  	/**
  	 * hard space between chart and legend
  	 */
	spaceBetweenChartAndLegend: 20,
	
	/**
 	 * default text function for the legend
 	 */
 	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
	
	constructor: function(config) {
		var me = this;
		
		me.superclass.constructor.call(me, config)
	},
	
	/**
	 * @function
	 * @override
	 * @memberOf App.util.d3.PieChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function() {
		var me = this;
		
		//////////////////////////////////////////////////
		// sanity check
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			return;
		}
		
		//////////////////////////////////////////////////
		// bring vars into local scope
		//////////////////////////////////////////////////
		var dataMetric = me.dataMetric,
			canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight,
			colorScale = me.colorScale,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			clearMode = me.clearMode,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex;
			
		//////////////////////////////////////////////////
		// set the pie "g" element
		//////////////////////////////////////////////////
		var chartTranslateX = parseInt((me.getFlexUnit() * me.chartFlex)/2),
			chartTranslateY = parseInt(me.canvasHeight/2) + me.margins.top;
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
		
		//////////////////////////////////////////////////
		// the legend "g"
		//////////////////////////////////////////////////
		var legendTranslateX = (me.getFlexUnit() * me.chartFlex) + me.spaceBetweenChartAndLegend,
			legendTranslateY = me.margins.top;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
		
		//////////////////////////////////////////////////
		// adjust the outer radius
		//////////////////////////////////////////////////
		var chartWorkingWidth = me.getFlexUnit() * me.chartFlex,
			chartWorkingHeight = me.canvasHeight - me.margins.top;
		if(me.outerRadius == null) {
			if(chartWorkingWidth < chartWorkingHeight) {
				me.outerRadius = parseInt(chartWorkingWidth * .42);
			} else {
				me.outerRadius = parseInt(chartWorkingHeight * .42);
			}
		} else {
			if(chartWorkingWidth < chartWorkingHeight) {
				if(me.outerRadius > chartWorkingWidth) {
					me.outerRadius = parseInt(chartWorkingWidth * .42);
				}
			} else {
				if(me.outerRadius > chartWorkingHeight) {
					me.outerRadius = parseInt(chartWorkingHeight * .42);
				}
			}
		}
		var outerRadius = me.outerRadius;
			
		//////////////////////////////////////////////////
		// adjust the inner radius
		//////////////////////////////////////////////////
		if(me.innerRadius >= me.outerRadius) {
			me.innerRadius = parseInt(me.outerRadius * .75);
		}
		var innerRadius = me.innerRadius;

		//////////////////////////////////////////////////
		// set the pie layout
		//////////////////////////////////////////////////
		me.pieLayout = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[dataMetric];
			});
		
		//////////////////////////////////////////////////
		// set the arc objects
		//////////////////////////////////////////////////
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
		
		//////////////////////////////////////////////////
		// set the arc selection
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc');
		
		//////////////////////////////////////////////////
		// append the paths
		//////////////////////////////////////////////////
		segments.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d) {
				d3.select(this)
					.style('opacity', 1)
					.style('stroke', '#000000')
					.style('stroke-width', 1);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
				el.style('stroke', 'white')
				el.style('stroke-width', 1);
			});
		
		//////////////////////////////////////////////////
		// SHOW labels ??
		//////////////////////////////////////////////////
		if(me.showLabels) {
			var arc = me.arcObject;
			
			segments.append('text')
				.attr('transform', function(d, i) {
					var c = arc.centroid(d),
						x = c[0],
						y = c[1],
						h = Math.sqrt(x*x + y*y);
						
					return 'translate(' + (x/h * outerRadius) + ',' + ((y/h * outerRadius) + i) + ')';
				})
				.attr('dy', function(d, i) {
					return i%2 == 0 ? '.35em' : '.95em';
				})
				.attr('text-anchor', function(d) {
					return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
				})
				.text(me.labelFunction);
		}
		
		//////////////////////////////////////////////////
		// bring the pie "g" into local scope
		//////////////////////////////////////////////////
		var thePie = me.gPie;
		
		//////////////////////////////////////////////////
		// legend squares
		//////////////////////////////////////////////////
		me.gLegend.selectAll('rect')
			.data(me.graphData)
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			.style('defaultOpacity', 1)
			.style('opacity', 1);
			
		//////////////////////////////////////////////////
		// legend text elements
		//////////////////////////////////////////////////
		me.gLegend.selectAll('text')
			.data(me.graphData)
			.enter()
			.append('text')
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction)
			.on('mouseover', function(d, i) {
				// highlight this text
				d3.select(this)
					.style('fill', '#000099')
					.style('font-weight', 'bold');
					
				// highlight the selected arc
				thePie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.attr('transform', 'scale(1.1, 1.1)');
			})
			.on('mouseout', function(d, i) {
				// un-highlight this text
				var el = d3.select(this);
				el.style('fill', '#000000')
					.style('font-weight', 'normal');
				
				// select the arc and transition
				thePie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(250)
				.attr('transform', 'scale(1,1)');
			});

		//////////////////////////////////////////////////
		// chart title
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top/2) + ')');
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#444444')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(function(d) {
					return d;
				});
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieLegendChart
 	 * @description Transition the graphic
 	 */
	transition: function() {
		
		var me = this;
		
		//////////////////////////////////////////////////
		// vars into local scope
		//////////////////////////////////////////////////
		var dataMetric = me.dataMetric,
			colorScale = me.colorScale,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight;
			
		//////////////////////////////////////////////////
		// new value function for pie layout
		//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[dataMetric];
		});
		
		//////////////////////////////////////////////////
		// join new arcs with old arcs
		//////////////////////////////////////////////////	
		var segments = me.gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData));
		
		//////////////////////////////////////////////////	
		// transition out old segments
		//////////////////////////////////////////////////
		segments.exit().remove();

		//////////////////////////////////////////////////
		// build new segments
		//////////////////////////////////////////////////	
		segments.enter()
			.append('g')
			.attr('class', 'arc')
			.append('path')
			.attr('d', me.arcObject)
			.style('fill', function(d, i) {
				return colorScale(i);
			})
			.attr('defaultOpacity', .6)
			.style('opacity', .6)
			.call(d3.helper.tooltip().text(me.tooltipFunction))
			.on('mouseover', function(d) {
				d3.select(this)
					.style('opacity', 1)
					.style('stroke', '#000000')
					.style('stroke-width', 1);
			})
			.on('mouseout', function(d) {
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
				el.style('stroke', 'white')
				el.style('stroke-width', 1);
			});
			
		//////////////////////////////////////////////////
		// handle path changes
		//////////////////////////////////////////////////	
		me.svg.datum(me.graphData).selectAll('path')
			.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
		
		//////////////////////////////////////////////////
		// transition labels
		//////////////////////////////////////////////////
		if(me.showLabels) {
			var arc = me.arcObject;
			
			// remove current text elements
			me.gPie.selectAll('text').remove();
			
			// replacements
			segments.append('text')
				.attr('transform', function(d, i) {
					var c = arc.centroid(d),
						x = c[0],
						y = c[1],
						h = Math.sqrt(x*x + y*y);
						
					return 'translate(' + (x/h * outerRadius) + ',' + ((y/h * outerRadius) + i) + ')';
				})
				.attr('dy', function(d, i) {
					return i%2 == 0 ? '.35em' : '.95em';
				})
				.attr('text-anchor', function(d) {
					return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
				})
				.text(me.labelFunction);
		}
		
		//////////////////////////////////////////////////
		// LEGEND SQUARES
		//////////////////////////////////////////////////
		
		// join new squares with current squares
		var legendSquareSelection = me.gLegend.selectAll('rect')
			.data(me.graphData);
			
		// remove old text
		legendSquareSelection.exit().remove();
		
		// add new squares
		legendSquareSelection.enter().append('rect');
		
		// transition all
		legendSquareSelection.transition()
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.attr('fill', function(d, i) {
				return colorScale(i);
			});
			
		//////////////////////////////////////////////////
		// TRANSITION LEGEND TEXT
		//////////////////////////////////////////////////
		
		// join new text with current text
		var legendTextSelection = me.gLegend.selectAll('text')
			.data(me.graphData);
			
		// remove old text
		legendTextSelection.exit().remove();
		
		// add new
		legendTextSelection.enter().append('text');
		
		// transition all
		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction)
			.on('mouseover', function(d, i) {
				// highlight this text
				d3.select(this)
					.style('fill', '#000099')
					.style('font-weight', 'bold');
					
				// highlight the selected arc
				thePie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.attr('transform', 'scale(1.1, 1.1)');
			})
			.on('mouseout', function(d, i) {
				// un-highlight this text
				var el = d3.select(this);
				el.style('fill', '#000000')
					.style('font-weight', 'normal');
				
				// select the arc and transition
				thePie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(250)
				.attr('transform', 'scale(1,1)');
			});
				
		//////////////////////////////////////////////////
		// transition chart title
		//////////////////////////////////////////////////
		var titleSelection = me.gTitle.selectAll('text');
		if(me.chartTitle) {
			titleSelection.text(me.chartTitle);
		} else {
			titleSelection.text('');
		}
	},
	
	/**
 	 * @function
 	 * @memberOf App.util.d3.PieLegendChart
 	 * @description Return the width of a flex "unit" based on total canvas width
 	 */
	getFlexUnit: function() {
		var me = this,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			spaceBetweenChartAndLegend = me.spaceBetweenChartAndLegend,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex;
		
		var workingWidth = canvasWidth - spaceBetweenChartAndLegend;
		
		return Math.floor(workingWidth/(chartFlex + legendFlex));
	},
	
	setLegendTextFunction: function(fn) {
		var me = this;
		
		me.legendTextFunction = fn;
	}
});
	