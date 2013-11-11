Ext.define('Sandbox.util.viz.PieLegendChart', {
	svg: null,
	canvasHeight: 100,
	canvasWidth: 100,
	graphData: [],
	pieLayout: null,
	arcObject: null,
	panelId: null,
	colorScale: d3.scale.category20(),
	
	/**
 	 * margins object
 	 */
 	margins: {
	 	top: 20,
	 	right: 0,
	 	bottom: 0,
	 	left: 0
	},
	
	/**
 	 * The "g" element to hold the pie chart
 	 */
 	gPie: null,
	
	/**
 	 * The "g" element to hold the legend
 	 */
 	gLegend: null,
	
	/**
 	 * The "g" element to hold the title
 	 */
 	gTitle: null,
 	chartTitle: null,
	
	/**
 	 * relative measure of chart's "flex"
 	 */
 	chartFlex: 1,
 	
 	/**
  	 * relative measure of legend's "flex"
  	 */
  	legendFlex: 1,
	
	/**
	 * default outer radius
	 */
	outerRadius: 50,
	
	/**
	 * default inner radius, gt 0 = donut chart
	 */
	innerRadius: 0,
	
	/**
 	 * percentage to calculate inner radius
 	 * from outer radius
 	 */
	innerRadiusPercentage: null,
	
	/**
 	 * percentage by which to pad spacing around
 	 * the chart
 	 */
 	chartPaddingPercentage: .9,
 	
 	/**
 	 * hard # of pixels to add between the chart
 	 * and the legend
 	 */
 	spaceBetweenChartAndLegend: 20,
 	
 	/**
  	 * default width of each legend square
  	 */
  	legendSquareWidth: 10,
  	
  	/**
   	 * default height of each legend square
   	 */
	legendSquareHeight: 10,
	
	/**
 	 * show the labels
 	 */
 	showLabels: false,
	
	/**
 	 * default function for chart tooltip
 	 */
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	/**
 	 * default label function
 	 */
 	labelFunction: function(data, index) {
	 	return 'label';
	},
	
	/**
 	 * default text function for legend
 	 */
 	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
	
	/**
 	 * event handling
 	 */
	handleEvents: false,
	eventRelay: false,
	mouseOverEvents: {
		enabled: false,
		eventName: '',
		eventDataMetric: ''
	},
	
	/**
	 * default clear mode
	 */
	clearMode: 'scale',
  	
  	/**
   	 * INIT
   	 */
	constructor: function(config) {
		var me = this;
		
		Ext.apply(me, config);
		
		if(config.handleEvents) {
			me.eventRelay = Ext.create('Sandbox.util.MessageBus');
		}
		
		// total flex units
		var totalFlexUnits = me.chartFlex + me.legendFlex;
		
		// width of each flex unit
		var flexUnitWidth = Math.floor(me.canvasWidth/totalFlexUnits);
		
		// show much width will the chart take up?
		var chartWidth = flexUnitWidth * me.chartFlex;
		
		if(chartWidth > me.canvasHeight) {
			me.outerRadius = parseInt((me.canvasHeight * me.chartPaddingPercentage)/2);
		} else {
			me.outerRadius =  parseInt((chartWidth * me.chartPaddingPercentage)/2);
		}
		me.outerRadius = me.outerRadius - parseInt(me.margins.top/2);
		
		// inner radius calculation
		if(me.innerRadiusPercentage > 0 && me.innerRadiusPercentage < 1) {
			me.innerRadius = parseInt(me.outerRadius * me.innerRadiusPercentage);
		}
	},
	
	/**
	 * @function
	 * @memberOf Sandbox.util.viz.PieLegendChart
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 */
	draw: function(metric) {
		var me = this;
		
		// sanity check
		if(me.svg == null) {
			Ext.Msg.alert('Configuration Error',
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		// bring configuration vars into local scope
		var gPie = me.gPie,
			colorScale = me.colorScale,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius,
			legendSquareHeight = me.legendSquareHeight,
			legendSquareWidth = me.legendSquareWidth;
		
		//////////////////////////////////////////////////
		// no data ??
		//////////////////////////////////////////////////
		if(me.graphData.length == 0) {
			me.svg.selectAll('g')
				.transition()
				.duration(500)
				.attr('transform', me.getClearMode())
				.remove();
			
			me.drawNoData();
			return;
		}
			
		//////////////////////////////////////////////////
		// X/Y translation for chart
		//////////////////////////////////////////////////
		var chartTranslateX = parseInt(((me.canvasWidth/(me.chartFlex + me.legendFlex)) * me.chartFlex)/2);
		var chartTranslateY = parseInt(me.canvasHeight/2);
		
		//////////////////////////////////////////////////
		// X/Y translation for legend
		//////////////////////////////////////////////////
		var legendTranslateX = parseInt(((me.canvasWidth/(me.chartFlex + me.legendFlex)) * me.chartFlex))
			+ me.spaceBetweenChartAndLegend;
		var legendTranslateY = parseInt(me.canvasHeight/me.graphData.length);

		//////////////////////////////////////////////////
		// set the pie layout
		//////////////////////////////////////////////////
		me.pieLayout = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[metric];
			});
		
		//////////////////////////////////////////////////
		// set the arc objects
		//////////////////////////////////////////////////
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);
			
		//////////////////////////////////////////////////
		// set the pie "g" element
		//////////////////////////////////////////////////
		me.gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
		
		//////////////////////////////////////////////////
		// set the legend "g" element
		//////////////////////////////////////////////////	
		me.gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
		
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
				
				if(handleEvents && eventRelay && mouseOverEvents.enabled) {
					eventRelay.publish(
						mouseOverEvents.eventName,
						{
							value: d.data[mouseOverEvents.eventDataMetric]
						}
					);
				}
				
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
		// LEGEND RECTANGLES
		//////////////////////////////////////////////////
		me.gLegend.selectAll('rect')
			.data(me.graphData)
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 2;
			})
			.attr('width', me.legendSquareWidth)
			.attr('height', me.legendSquareHeight)
			.attr('fill', function(d, i) {
				return colorScale(i);
			})
			.style('defaultOpacity', 1)
			.style('opacity', 1)
			.style('stroke', 'white')
			.style('stroke-width', 1)
			.on('mouseover', function(d, i) {
			
				// fade this rectangle
				d3.select(this).style('opacity', .4);
				
				// select the arc and transition
				gPie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(0)
				.attr('transform', 'scale(1.1, 1.1)');
			})
			.on('mouseout', function(d, i) {
				
				// unfade this rect
				var el = d3.select(this);
				el.style('opacity', el.attr('defaultOpacity'));
				
				// select the arc and transition
				gPie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(500)
				.attr('transform', 'scale(1,1)');
			});
	
		//////////////////////////////////////////////////
		// LEGEND TEXT ELEMENTS
		//////////////////////////////////////////////////
		me.gLegend.selectAll('text')
			.data(me.graphData)
			.enter()
			.append('text')
			.attr('x', legendSquareWidth * 2)
			.attr('y', function(d, i) {
				return i * legendSquareHeight * 2;
			})
			.attr('transform', 'translate(0, ' + legendSquareHeight + ')')
			.text(me.legendTextFunction)
			.on('mouseover', function(d, i) {
			
				// fade this rectangle
				d3.select(this)
					.style('fill', '#000099')
					.style('font-weight', 'bold');
				
				// select the arc and transition
				gPie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(0)
				.attr('transform', 'scale(1.1, 1.1)');
			})
			.on('mouseout', function(d, i) {
				
				// unfade this rect
				var el = d3.select(this);
				el.style('fill', '#000000')
					.style('font-weight', 'normal');
				
				// select the arc and transition
				gPie.selectAll('.arc').filter(function(e, j) {
					return i == j;
				})
				.transition()
				.duration(500)
				.attr('transform', 'scale(1,1)');
			});
			
		//////////////////////////////////////////////////
		// TITLE
		//////////////////////////////////////////////////
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate(15,' + parseInt(me.margins.top) + ')');
			
		if(me.chartTitle != null) {
			me.gTitle.selectAll('text')
				.data([me.chartTitle])
				.enter()
				.append('text')
				.style('fill', '#333333')
				.style('font-weight', 'bold')
				.style('font-family', 'sans-serif')
				.text(function(d) {
					return d;
				});
		}
	},
	
	/**
	 * @function
	 * @memberOf Sandbox.util.viz.PieLegendChart
	 * @param metric String
	 * @description Transition the arcs of the pie chart based on the new metric
	 */
	transition: function(metric) {
		var me = this,
			path = me.svg.datum(me.graphData).selectAll('path');
			
		//////////////////////////////////////////////////
		// new value function for pie layout
		//////////////////////////////////////////////////
		me.pieLayout.value(function(d) {
			return d[metric];
		});
		
		//////////////////////////////////////////////////
		// transition the arcs
		//////////////////////////////////////////////////
		path.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
			
		//////////////////////////////////////////////////
		// transition the legend labels
		// still preserves the mouseover/mouseout events
		//////////////////////////////////////////////////
		me.gLegend.selectAll('text')
			.text(me.legendTextFunction);
			
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
 	 * function
 	 */
	getClearMode: function() {
		var me = this;
		
		switch(me.clearMode) {
			case 'explode':
			return 'scale(5, 5)';
			break;

			case 'rotate':
			case 'rotateLeft':
			case 'rotateRight':
			return 'rotate(90)';
			break;
			
			case 'wipeLeft':
			return 'translate(-1200, 0)';
			break;
			
			case 'wipeRight':
			return 'translate(1200, 0)';
			break;
			
			case 'wipeDown':
			return 'translate(0, 1200)';
			break;
			
			default:
			return 'scale(0,0)';
			break;
		}
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.PieLegendChart
 	 * @description Change inner radius
 	 */
	setInnerRadius: function(r) {
		var me = this;
		
		if(parseInt(r) >= 0) {
			me.innerRadius = parseInt(r);
		}
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.PieLegendChart
 	 * @description Set/change the chart title
 	 */
 	setChartTitle: function(title) {
	 	var me = this;
	 	me.chartTitle = title;
	},
	
	/**
 	 * @function
 	 * @memberOf Sandbox.util.viz.PieLegendChart
 	 * @description "No data" drawing"
 	 */
	drawNoData: function() {
		var me = this;
		Sandbox.util.Global.noDataSvgImage(me.svg, me.canvasWidth, me.canvasHeight, 'No data');
	}
});