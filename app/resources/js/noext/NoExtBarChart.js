/**
 * No ExtJS Bar Chart
 */
function NoExtBarChart(containerSelector) {
	var me = this;
	
	/**
 	 * The primary SVG element
 	 */
 	me.svg = null;
 	
 	/**
 	 * other configs
 	 */
 	me.barPadding = 5,
 	me.canvasHeight = 400,
	me.canvasWidth = 400,
	me.chartFlex = 3,
	me.chartInitialized = false,
	me.chartTitle = null,
	me.colorScale = d3.scale.category20(),
	me.colorScaleUniform = null,
	me.container = d3.select(containerSelector),
	me.dataMetric = 'value',
	
	me.gBar = null,
	me.gLegend = null,
	me.gLabel = null,
	me.gTitle = null,
	me.gXAxis = null,
	me.gYAxis = null,
	
	me.graphData = [],
	me.heightOffset = 0,
	
	me.labelDistanceFromBar = 10,
	me.labelClass = 'labelText',
	me.labelFunction = function(d, i) {
		return 'label';
	},
	me.labelOffsetTop = 10,
	
	me.legendClass = 'legendText',
	me.legendBoldClass = 'legendTextBold',
	me.legendOverClass = 'legendTextBoldOver',
	me.legendFlex = 1,
	me.legendSquareWidth = 10,
  	me.legendSquareHeight = 10,
  	me.legendTextFunction = function(data, index) {
	 	return 'legend item';
	},
	me.spaceBetweenChartAndLegend = 20,
	me.margins = {
		top: 20,
		right: 10,
		bottom: 15,
		left: 60,
		leftAxis: 50
	},
	me.maxBarWidth = 75,
	me.opacities = {
		rect: {
			default: .65,
			over: 1
		}
	},
	me.orientation = 'vertical',
	me.showChartTitle = false,
	me.showLabels = false,
	me.showLegend = false,
	me.sortType = null,
	me.sortProperty = null,
	
	// X
	me.xScale = null,
	
	// Y
	me.yAxis = null,
	me.yAxisScale = null,
	me.yScale = null,
	me.yScalePadding = 0.1,
	me.yScaleRange = 'absolute',
	me.yTicks = 10,
 	me.yTickFormat = function(d) {
	 	return d;
	};

	/**
 	 * @function
 	 * @memberOf NoExtBarChart
 	 * @description Initialize the chart components
 	 */
	me.initChart = function() {
		
		//////////////////////////////
		// set canvas width/height and
		// primary SVG component
		//////////////////////////////
		me.canvasHeight = parseInt(me.container.style('height'));
		me.canvasWidth = parseInt(me.container.style('width'));
		me.svg = me.container.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight)
			.attr('viewBox', '0,0,' + me.canvasWidth + ',' + me.canvasHeight)
			.attr('preserveAspectRatio', 'xMidYMid meet');
			
		//////////////////////////////
		// adjust margins, height offset
		//////////////////////////////
		me.margins.top += me.labelOffsetTop;
		me.heightOffset = me.canvasHeight - me.margins.top - me.labelOffsetTop;
		
		//////////////////////////////
		// initialize "g" elements
		//////////////////////////////
		me.gBar = me.svg.append('svg:g');
		
		me.gLabel = me.svg.append('svg:g');
		
		me.gYAxis = me.svg.append('svg:g')
			.attr('class', 'axis')
			.attr('transform', 'translate(' + me.margins.leftAxis + ',0)');
		
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
		
		var legendTranslateX = me.margins.left 
			+ (me.getFlexUnit() * me.chartFlex)
			+ me.spaceBetweenChartAndLegend;
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ', ' + me.margins.top + ')');
		
		me.chartInitialized = true;

		return me;
	};
	
	/**
 	 * @function
 	 * @description Draw/redraw
 	 */
	me.draw = function() {
		if(!me.chartInitialized) { return; }
		
		//////////////////////////////
		// set scales
		//////////////////////////////
		me.setXScale();
		me.setYScale();
		me.setYAxisScale();
		
		//////////////////////////////
		// chart component handlers
		//////////////////////////////
		me.handleBars();
		me.handleLabels();
		me.handleLegend();
		me.handleChartTitle();
		me.callAxes();
	};
	
	/**
 	 * @function
 	 * @description Draw/render/transition the chart bars
 	 */
	me.handleBars = function() {
	
		// local scope
		var dataMetric = me.dataMetric,
			oneFlexUnit = me.getFlexUnit(),
			handleMouseEvent = me.handleMouseEvent;	// fn

		//////////////////////////////
		// BARS - JRAT
		//////////////////////////////
		var rectSelection = me.gBar.selectAll('rect')
			.data(me.graphData);
			
		rectSelection.exit()
			.transition()
			.duration(500)
			.attr('width', 0)
			.remove();
			
		rectSelection.enter()
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.style('opacity', me.opacities.rect.default)
			.style('stroke', '#333333')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'rect', 'mouseout', d, i);
			});
		
		rectSelection.transition()
			.duration(500)
			.attr('x', function(d, i) {
				return me.xScale(i);
			})
			.attr('y', function(d, i) {
				return me.canvasHeight - me.yScale(d[dataMetric]);
			})
			.attr('width', function(d, i) {
				var w;
				if(me.showLegend) {
					w = ((oneFlexUnit * me.chartFlex) / me.graphData.length) - me.barPadding;
				} else {
					w = (me.canvasWidth - (me.margins.left + me.margins.right))/me.graphData.length - me.barPadding;
				}
				
				return Math.min(w, me.maxBarWidth);
			})
			.attr('height', function(d, i) {
				return me.yScale(d[dataMetric]) - me.margins.bottom;
			})
			.style('fill', function(d, i) {
				return me.colorScale(i);
			});
	};
	
	/**
	 * @function
	 * @description Render/draw/transition chart labels
	 */
	me.handleLabels = function() {
		
		// local scope	
		var oneFlexUnit = me.getFlexUnit(),
			dataMetric = me.dataMetric;
	
		if(me.showLabels) {
			
			var labelSelection = me.gLabel.selectAll('text')
				.data(me.graphData);
				
			labelSelection.exit().remove();
		
			// VERTICAL
			if(me.labelOrientation == 'vertical') {
			
				labelSelection.enter()
					.append('text')
					.attr('class', me.labelClass)
					.attr('text-anchor', 'start');
					
				labelSelection.transition()
					.duration(300)
					.attr('x', function(d, i) {
						if(me.showLegend) {
							var calculatedWidth = ((oneFlexUnit * me.chartFlex)/me.graphData.length) - me.barPadding;
						} else {
							var calculatedWidth = (me.canvasWidth - (me.margins.left + me.margins.right))/me.graphData.length - me.barPadding;
						}
						
						// lesser of 2 widths
						return me.xScale(i)
							+ parseInt(Math.min(me.maxBarWidth, calculatedWidth)/2);
					})
					.attr('y', function(d) {
						return me.canvasHeight - parseInt(me.margins.bottom * 1.5);
					})
					.attr('transform', function(d, i) {
						if(me.showLegend) {
							var calculatedWidth = ((oneFlexUnit * me.chartFlex)/me.graphData.length) - me.barPadding;
						} else {
							var calculatedWidth = (me.canvasWidth - (me.margins.left + me.margins.right))/me.graphData.length - me.barPadding;
						}
							
						// lesser of 2 widths
						var x = me.xScale(i)
							+ parseInt(Math.min(me.maxBarWidth, calculatedWidth)/2);
						var y = me.canvasHeight - parseInt(me.margins.bottom * 1.5);
						
						return 'rotate(-90,' + x + ',' + y + ')';
					})
					.text(me.labelFunction);
			}
			// HORIZONTAL
			else {
				labelSelection.enter()
					.append('text')
					.attr('class', me.labelClass)
					.attr('text-anchor', 'start');
				
				labelSelection.transition()
					.duration(300)
					.attr('x', function(d, i) {
						return me.xScale(i);
					})
					.attr('y', function(d) {
						return me.canvasHeight - me.yScale(d[dataMetric]) - me.labelDistanceFromBar;
					})
					.attr('transform', 'rotate(0)')
					.text(me.labelFunction);
			}
	 	} else {
		 	me.gLabel.selectAll('text')
				.transition()
				.duration(250)
				.attr('x', -100)
				.remove();
		}
	};
	
	/**
 	 * @function
 	 * @memberOf NoExtBarChart
 	 * @description Handle the bar chart legend
 	 */
	me.handleLegend = function() {
		var me = this;
		
		if(!me.showLegend) {
			me.gLegend.selectAll('rect')
				.transition()
				.duration(500)
				.attr('y', -500)
				.remove();
				
			me.gLegend.selectAll('text')
				.transition()
				.duration(500)
				.attr('x', me.canvasWidth + 200)
				.remove();
				
			return;
		}
		
		// local scope
		var colorScale = me.colorScale,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth;
			
		////////////////////////////////////////
		// LEGEND SQUARES - JRAT
		////////////////////////////////////////
		var legendSquareSelection = me.gLegend.selectAll('rect')
			.data(me.graphData);
				
		legendSquareSelection.exit().remove();
			
		legendSquareSelection.enter().append('rect')
			.style('opacity', me.opacities.rect.default)
			.style('stroke', '#333333')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendRect', 'mouseout', d, i);
			});
		
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
		
		////////////////////////////////////////
		// LEGEND TEXT - JRAT
		////////////////////////////////////////
		var legendTextSelection = me.gLegend.selectAll('text')
			.data(me.graphData);
				
		legendTextSelection.exit().remove();
			
		legendTextSelection.enter().append('text')
			.style('cursor', 'default')
			.attr('class', me.legendClass)
			.on('mouseover', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseover', d, i);
			})
			.on('mouseout', function(d, i) {
				me.handleMouseEvent(this, 'legendText', 'mouseout', d, i);
			});
		
		legendTextSelection.transition()
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 1.75;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction);
	},
	
	/**
	 * @function
	 * @memberOf NoExtBarChart
	 * @description Mouse event handler
	 * @param el Element
	 * @param elType String
	 * @param evt String
	 * @param d Object
	 * @param i Integer
	 */
	me.handleMouseEvent = function(el, elType, evt, d, i) {

		////////////////////////////////////////
		// RECTANGLES
		////////////////////////////////////////
		if(elType == 'rect') {
		
			if(evt == 'mouseover') {
				d3.select(el).style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
					
				me.gLegend.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
					
				me.gLegend.selectAll('text')
					.filter(function(e, j, z) {
						return i === j;
					})
					.attr('class', me.legendBoldClass)
					.style('fill', '#990066');
			}
			
			if(evt == 'mouseout') {
				d3.select(el).style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
					
				me.gLegend.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
					
				me.gLegend.selectAll('text')
					.filter(function(e, j, z) {
						return i === j;
					})
					.attr('class', me.legendClass)
					.style('fill', '#000000');
			}
		}
		
		////////////////////////////////////////
		// LEGEND RECTANGLES
		////////////////////////////////////////
		if(elType == 'legendRect') {
		
			if(evt == 'mouseover') {
				d3.select(el).style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
					
				me.gBar.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
					
				me.gLegend.selectAll('text')
					.filter(function(e, j, z) {
						return i === j;
					})
					.attr('class', me.legendBoldClass)
					.style('fill', '#990066');
			}
			
			if(evt == 'mouseout') {
				d3.select(el).style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
					
				me.gBar.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
					
				me.gLegend.selectAll('text')
					.filter(function(e, j, z) {
						return i === j;
					})
					.attr('class', me.legendClass)
					.style('fill', '#000000');
			}
		}
		
		////////////////////////////////////////
		// LEGEND TEXT
		////////////////////////////////////////
		if(elType == 'legendText') {
		
			if(evt == 'mouseover') {
				d3.select(el).attr('class', me.legendBoldClass)
					.style('fill', '#990066');
					
				me.gBar.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
					
				me.gLegend.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.over)
					.style('stroke', '#000000');
			}
			
			if(evt == 'mouseout') {
				d3.select(el).attr('class', me.legendClass)
					.style('fill', '#000000');
					
				me.gBar.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
					
				me.gLegend.selectAll('rect')
					.filter(function(e, j, z) {
						return i === j;
					})
					.style('opacity', me.opacities.rect.default)
					.style('stroke', '#333333');
			}
		}
	};
	
	/**
	 * @function
	 * @description Handle the chart title
	 */
	me.handleChartTitle = function() {
		
		me.gTitle.selectAll('text').remove();
		
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#333333')
				.style('font-size', '12px')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.style('text-anchor', 'middle')
				.text(String);
		}
	};
	
	/**
	 * @function
	 * @description Call the Y axis
	 */
	me.callAxes = function() {
		me.svg.selectAll('g.axis')
			.transition()
			.duration(500)
			.call(me.yAxis);
	};
	
	/****************************************
	 * 
	 *
	 * GETTERS
	 *
	 *
	 ****************************************/
	 
	/**
	 * @function
	 */
	me.getFlexUnit = function() {
		var workingWidth = me.canvasWidth - me.margins.left - me.margins.right;
			
		return Math.floor(workingWidth / (me.chartFlex + me.legendFlex));
	};
	
	/**
 	 * @function
 	 */
	me.getMinMaxY = function() {
		var metric = me.dataMetric,
			yScalePadding = me.yScalePadding,
			minY,
			maxY;
			
		if(me.yScaleRange == 'relative') {
			minY = d3.min(me.graphData, function(d) {
				var t = d[metric];
				if(t < 0) {
					return d[metric] + (d[metric] * yScalePadding);
				} else {
					return d[metric] - (d[metric] * yScalePadding);
				}
			});
		} else {
			minY = Math.min(0, d3.min(me.graphData, function(d) {
					var t = d[metric];
					if(t < 0) {
						return d[metric] + (d[metric] * yScalePadding);
					} else {
						return d[metric] - (d[metric] * yScalePadding);
					}
				})
			);
		}
		
		maxY = d3.max(me.graphData, function(d) {
			return d[metric] + (d[metric] * yScalePadding);
		});
		
		return [minY, maxY];
	};
	
	/****************************************
	 * 
	 *
	 * SETTERS
	 *
	 *
	 ****************************************/
 	me.setXScale = function() {
		if(me.showLegend) {
			var legendUnits = me.getFlexUnit() * me.legendFlex;
			
			var diff = me.canvasWidth - me.margins.right - legendUnits;
			
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, diff]);
		} else {
			me.xScale = d3.scale.linear()
				.domain([0, me.graphData.length])
				.range([me.margins.left, me.canvasWidth - me.margins.right]);
		}
	};
	
	me.setYScale = function() {
		var metric = me.dataMetric;
		
		console.log('canvas height = ' + me.canvasHeight);
		console.log('height offset = ' + me.heightOffset);
		me.yScale = d3.scale.linear()
			.domain(me.getMinMaxY())
			.range([me.margins.bottom, me.heightOffset]);
	};
	
	me.setYAxisScale = function() {
		var metric = me.dataMetric;
		
		me.yAxisScale = d3.scale.linear()
			.domain(me.getMinMaxY())
			.range([me.canvasHeight-me.margins.bottom, me.canvasHeight - me.heightOffset]);
			
		var useYTicks = me.yTicks;
			
		// figure out the actual y ticks
		var gdMax = d3.max(me.graphData, function(d) { return d[metric];});
		if(gdMax < useYTicks) {
			useYTicks = gdMax;
		}
			
		me.yAxis = d3.svg.axis()
			.scale(me.yAxisScale)
			.orient('left')
			.ticks(useYTicks)
			.tickFormat(me.yTickFormat);
	};
}