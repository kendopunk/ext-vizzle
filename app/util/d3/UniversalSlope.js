/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.util.d3
 * @description Configurable slopegraph class
 */
Ext.define('App.util.d3.UniversalSlope', {
	
	/**
	 * The primary SVG element.  Must be set outside the class and
	 * and passed as a configuration item
	 */
	svg: null,
	
	gAxis: null,
	gAxisLabel: null,
	gConnector: null,
	gLeft: null,
	gRight: null,
	gTitle: null,
	
	leftMetric: 'value',
	leftLabel: 'left',
	leftLabelFn: function(data) {
		return 'left';
	},
	
	rightMetric: 'value',
	rightLabel: 'right',
	rightLabelFn: function(data) {
		return 'right';
	},
	
	axisColor: '#009900',
	axisPadding: 10,
	canvasHeight: 400,
	canvasWidth: 500,
	chartTitle: 'Slopegraph',
	graphData: [],
	margins: {
		top: 10,
		right: 20,
		rightText: 10,
		bottom: 10,
		left: 20,
		leftText: 10
	},
	panelId: null,
	
	thresholdScale: null,
	lowColor: 'blue',
	highColor: 'red',
	
	tooltipFunction: function(data, index) {
		return 'tooltip';
	},
	
	yMin: 0,
	yMax: 1000,
	yScale: null,
	
	/**
 	 * constructor
 	 */
	constructor: function(config) {
		var me = this;
		
		Ext.merge(me, config);
	},
	
	/**
	 * @function
	 * @description Initialize chart
	 */
	initChart: function() {
	
		var me = this;
		
		//////////////////////////////////////////////////
		// configure "g"s
		//////////////////////////////////////////////////
		me.gAxis = me.svg.append('svg:g');
		me.gAxisLabel = me.svg.append('svg:g');
		me.gLeft = me.svg.append('svg:g');
		me.gRight = me.svg.append('svg:g');
		me.gConnector = me.svg.append('svg:g');
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ','
			+ parseInt(me.margins.top/2)
			+ ')');
		
		return me;
	},
	
	/**
 	 * @function
 	 * @description Draw/regenerate
 	 */
	draw: function() {
	
		var me = this;
		
		var margins = me.margins;
		
		//////////////////////////////////////////////////
		// set the min/max Y values
		//////////////////////////////////////////////////
		me.setMinMaxY();

		//////////////////////////////////////////////////
		// KEEP THIS ORDER !!
		//////////////////////////////////////////////////
		me.setYScale();
		me.drawAxes();
		me.drawAxisLabels();
		me.drawTitle();
		me.drawLeft();
		me.drawRight();
		me.drawConnectors();
	},
	
	/**
 	 * @function
 	 * @description Set the min/max Y values based on metric
 	 */
	setMinMaxY: function() {
		var me = this;
		
		var leftMetric = me.leftMetric, rightMetric = me.rightMetric;
		
		var leftMin = d3.min(me.graphData, function(d) { return d[leftMetric];});
		var leftMax = d3.max(me.graphData, function(d) { return d[leftMetric];});
		var rightMin = d3.min(me.graphData, function(d) { return d[rightMetric];});
		var rightMax = d3.max(me.graphData, function(d) { return d[rightMetric];});
		
		me.yMin = rightMin < leftMin ? rightMin : leftMin;
		me.yMax = rightMax > leftMax ? rightMax : leftMax;
	},
	
	/**
 	 * @function
 	 * @desciption Adjust the Y scale for both left and right
 	 */
	setYScale: function() {
		var me = this;
		
		me.yScale = d3.scale.linear()
			.domain([me.yMax, me.yMin])
			.range([
				me.margins.top + me.axisPadding,
				me.canvasHeight - me.margins.bottom - me.axisPadding
			]);
	},
	
	/**
 	 * @function
 	 * @description Draw the left labels
 	 */
	drawLeft: function() {
		var me = this;
		
		var yScale = me.yScale,
			leftMetric = me.leftMetric;
			
		// join new with old
		var textSelection = me.gLeft.selectAll('text')
			.data(me.graphData);
			
		// transition out old
		textSelection.exit()
			.transition()
			.duration(250)
			.attr('x', -200);
			
		// add new text
		var newText = textSelection.enter()
			.append('text')
			.style('cursor', 'default')
			.style('text-anchor', 'start');
			
		// transition all
		textSelection.transition()
			.duration(250)
			.attr('x', me.margins.leftText)
			.attr('y', function(d) {
				return yScale(d[leftMetric]);
			})
			.text(me.leftLabelFn);
			
		// call the tooltip function
		textSelection.call(d3.helper.tooltip().text(me.tooltipFunction));
	},
	
	/**
	 * @function
	 * @description Draw the right labels
	 */
	drawRight: function() {
		var me = this;
		
		var yScale = me.yScale,
			rightMetric = me.rightMetric;
			
		// join new with old
		var textSelection = me.gRight.selectAll('text')
			.data(me.graphData);
			
		// transition out old
		textSelection.exit()
			.transition()
			.duration(250)
			.attr('x', -200);
			
		// add new text
		var newText = textSelection.enter()
			.append('text')
			.style('text-anchor', 'start');
			
		// transition all
		textSelection.transition()
			.duration(250)
			.attr('x', me.canvasWidth - me.margins.rightText)
			.attr('y', function(d) {
				return yScale(d[rightMetric]);
			})
			.text(me.rightLabelFn);
	},
	
	/**
 	 * @function
 	 * @description Draw the left->right connecting lines
 	 */
	drawConnectors: function() {
		var me = this;
		
		var yScale = me.yScale,
			canvasWidth = me.canvasWidth,
			margins = me.margins,
			leftMetric = me.leftMetric,
			rightMetric = me.rightMetric,
			thresholdScale = me.thresholdScale,
			lowColor = me.lowColor,
			highColor = me.highColor;
			
		// join new with old
		var lineSelection = me.gConnector.selectAll('line')
			.data(me.graphData);
			
		// transition out old
		lineSelection.exit()
			.transition()
			.duration(500)
			.attr('x2', function(d) {
				var el = d3.select(this);
				return el.attr('x1');
			})
			.remove();
			
		// add new lines
		var newLines = lineSelection.enter()
			.append('line')
			.style('stroke-width', 1.5);
			
		// transition all
		lineSelection.transition()
			.duration(250)
			.attr('x1', function(d) {
				return margins.left;
			})
			.attr('x2', function(d) {
				return canvasWidth - margins.right;
			})
			.attr('y1', function(d) {
				return yScale(d[leftMetric]);
			})
			.attr('y2', function(d) {
				return yScale(d[rightMetric]);
			})
			.style('stroke', function(d) {
				if(thresholdScale != null) {
					if(thresholdScale(d[leftMetric]/d[rightMetric]) == 1) {
						return highColor;
					}
					return lowColor;
				}
			});
	},
	
	/**
 	 * @function
 	 * @description Draw the left/right axes
 	 */
	drawAxes: function() {
		var me = this;
		
		var leftTrans = me.margins.left,
			rightTrans = me.canvasWidth - me.margins.right;
			
		me.gAxis.selectAll('line')
			.data([leftTrans, rightTrans])
			.enter()
			.append('line')
			.attr('x1', function(d) {
				return d;
			})
			.attr('x2', function(d) {
				return d;
			})			
			.attr('y1', me.margins.top)
			.attr('y2', me.canvasHeight - me.margins.bottom)
			.style('stroke', me.axisColor)
			.style('stroke-width', 1);
	},
	
	/**
	 * @function
	 * @description Draw the labels at the top of each axis
	 */
	drawAxisLabels: function() {
		var me = this;
		
		var leftLabel = me.leftLabel,
			leftTrans = me.margins.left,
			rightLabel = me.rightLabel,
			rightTrans = me.canvasWidth - me.margins.right,
			margins = me.margins;
		
		me.gAxisLabel.selectAll('text')
			.data([{
				label: leftLabel,
				trans: leftTrans
			}, {
				label: rightLabel,
				trans: rightTrans
			}])
			.enter()
			.append('text')
			.attr('x', function(d) {
				return d.trans;
			})
			.attr('y', function(d) {
				return margins.top - 15;
			})
			.style('font-weight', 'bold')
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d.label;
			});
	},
	
	drawTitle: function() {
		var me = this;
		
		if(me.chartTitle == null) {
			me.gTitle.selectAll('text').remove();
			return;
		}
		
		var titleSelection = me.gTitle.selectAll('text')
			.data([me.chartTitle]);
		
		titleSelection.exit().remove();
		
		var newTitle = titleSelection.enter()
			.append('text')
			.style('fill', '#444444')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.style('text-anchor', 'middle');
			
		titleSelection.transition().text(String);
	},
	
	/**
 	 * 
 	 * SETTERS
 	 *
 	 */
 	setGraphData: function(data) {
	 	var me = this;
	 	
	 	me.graphData = data;
	},
	
	setChartTitle: function(title) {
		var me = this;
		
		me.chartTitle = title;
	},
	
	setLeftMetric: function(metric) {
		var me = this;
		
		me.leftMetric = metric;
	},
	
	setLeftLabel: function(label) {
		var me = this;
		
		me.leftLabel = label;
	},
	
	setRightMetric: function(metric) {
		var me = this;
		
		me.rightMetric = metric;
	},
	
	setRightLabel: function(label) {
		var me = this;
		
		me.rightLabel = label;
	},
	
	setAxisColor: function(color) {
		var me = this;
		
		me.axisColor = color;
	},
	
	setAxisPadding: function(pd) {
		var me = this;
		
		me.axisPadding = pd;
	}
});