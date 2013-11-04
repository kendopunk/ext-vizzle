/*Ext.define('', {
	svg: null,
	canvasHeight: 100,
	canvasWidth: 100,
	graphData: [],
	pieLayout: null,
	arcObject: null,
	panelId: null,
	colorScale: d3.scale.category20(),
	
	*
 	 * relative measure of chart's "flex"
 	 *
 	chartFlex: 1,
 	
 	*
  	 * relative measure of legend's "flex"
  	 *
  	legendFlex: 1,
	
	*
	 * default outer radius
	 *
	outerRadius: 50,
	
	*
	 * default inner radius, gt 0 = donut chart
	 *
	innerRadius: 0,
	
	*
 	 * percentage to calculate inner radius
 	 * from outer radius
 	 *
	innerRadiusPercentage: null,
	
	*
 	 * percentage by which to pad spacing around
 	 * the chart
 	 *
 	chartPaddingPercentage: .9,
 	
 	*
 	 * hard # of pixels to add between the chart
 	 * and the legend
 	 *
 	spaceBetweenChartAndLegend: 20,
 	
 	*
  	 * default width of each legend square
  	 *
  	legendSquareWidth: 10,
  	
  	*
   	 * default height of each legend square
   	 *
	legendSquareHeight: 10,
	
	*
 	 * show the labels
 	 *
 	showLabels: false,
	
	*
 	 * default function for chart tooltip
 	 *
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	*
 	 * default label function
 	 *
 	labelFunction: function(data, index) {
	 	return 'label';
	},
	
	*
 	 * default text function for legend
 	 *
 	legendTextFunction: function(data, index) {
	 	return 'legend item';
	},
	
	*
 	 * event handling
 	 *
	handleEvents: false,
	eventRelay: false,
	mouseOverEvents: {
		enabled: false,
		eventName: '',
		eventDataMetric: ''
	},
	
	*
	 * default clear mode
	 *
	clearMode: 'scale',
  	
  	*
   	 * INIT
   	 *
	constructor: function(config) {
		Ext.apply(this, config);
		
		if(config.handleEvents) {
			this.eventRelay = Ext.create('asdf.util.MessageBus')
		}
		
		// total flex units
		var totalFlexUnits = this.chartFlex + this.legendFlex;
		
		// width of each flex unit
		var flexUnitWidth = Math.floor(this.canvasWidth/totalFlexUnits);
		
		// show much width will the chart take up?
		var chartWidth = flexUnitWidth * this.chartFlex;
		
		if(chartWidth > this.canvasHeight) {
			this.outerRadius = parseInt((this.canvasHeight * this.chartPaddingPercentage)/2);
		} else {
			this.outerRadius =  parseInt((chartWidth * this.chartPaddingPercentage)/2);
		}
		
		// inner radius calculation
		if(this.innerRadiusPercentage > 0 && this.innerRadiusPercentage < 1) {
			this.innerRadius = parseInt(this.outerRadius * this.innerRadiusPercentage);
		}
	},
	
	*
	 * @function
	 * @param metric String
	 * @description Draw/initialize the pie chart
	 *
	draw: function(metric) {
		var me = this;
		
		// sanity check
		if(me.svg == null) {
			Ext.Msg.alert('Configuration Error',
				'Missing required configuration data needed<br>to render visualization.'
			);
			return;
		}
		
		var canvasWidth = me.canvasWidth,
			canvasHeight = me.canvasHeight,
			graphData = me.graphData,
			innerRadius = me.innerRadius,
			outerRadius = me.outerRadius,
			colorScale = me.colorScale,
			chartFlex = me.chartFlex,
			legendFlex = me.legendFlex,
			legendSquareWidth = me.legendSquareWidth,
			legendSquareHeight = me.legendSquareHeight,
			clearMode = me.clearMode,
			spaceBetweenChartAndLegend = me.spaceBetweenChartAndLegend,
			handleEvents = me.handleEvents,
			eventRelay = me.eventRelay,
			mouseOverEvents = me.mouseOverEvents;
			
		if(graphData.length == 0) {
			me.svg.selectAll('g')
				.transition()
				.duration(500)
				.attr('transform', me.getClearMode())
				.remove();
			
			me.drawNoData();
			return;
		}
			
		// X/Y translation for chart
		var chartTranslateX = parseInt(((canvasWidth/(chartFlex + legendFlex)) * chartFlex)/2);
		var chartTranslateY = parseInt(canvasHeight/2);
		
		// X/Y translation for legend
		var legendTranslateX = parseInt(((canvasWidth/(chartFlex + legendFlex)) * chartFlex)) + me.spaceBetweenChartAndLegend;
		var legendTranslateY = parseInt(canvasHeight/me.graphData.length);

		// set the pie layout
		me.pieLayout = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d[metric];
			});
		
		// set the arc objects
		me.arcObject = d3.svg.arc()
			.outerRadius(me.outerRadius)
			.innerRadius(me.innerRadius);

		var gPie = me.svg.append('svg:g')
			.attr('transform', 'translate(' + chartTranslateX + ',' + chartTranslateY + ')');
			
		var gLegend = me.svg.append('svg:g')
			.attr('transform', 'translate(' + legendTranslateX + ',' + legendTranslateY + ')');
		
		var segments = gPie.selectAll('.arc')
			.data(me.pieLayout(me.graphData))
			.enter()
			.append('g')
			.attr('class', 'arc');
		
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
		
		// show labels ??	
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
		
		*
 		 * legend rectangles
 		 *
		gLegend.selectAll('rect')
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
	
		*
 		 * legend text elements
 		 *
		gLegend.selectAll('text')
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
			
	},
	
	*
	 * @function
	 * @param metric String
	 * @description Transition the arcs of the pie chart based on the new metric
	 *
	transition: function(metric) {
		var me = this,
			path = me.svg.datum(me.graphData).selectAll('path');
			
		// new value function
		me.pieLayout.value(function(d) {
			return d[metric];
		});
		
		// transition the arcs
		path = path.data(me.pieLayout)
			.transition()
			.duration(250)
			.attr('d', me.arcObject);
			
		// transition the legend labels
		// still preserves the mouseover/mouseout events
		me.svg.selectAll('text')
			.text(me.legendTextFunction);
	},
	
	*
 	 * function
 	 *
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
	
	*
 	 * @function
 	 * @description Change inner radius
 	 *
	setInnerRadius: function(r) {
		this.innerRadius = r;
	},
	
	*
 	 * @description "No data" drawing"
 	 *
	drawNoData: function() {
		var me = this;
	}
});*/