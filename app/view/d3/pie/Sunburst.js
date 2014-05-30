/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.pie
 * @description Sunburst partition layout
 */
Ext.define('App.view.d3.pie.Sunburst', {
	extend: 'Ext.Panel',
	alias: 'widget.sunburstPartition',
	title: 'Sunburst Partitionasdfasfds',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.final.RadialTree'
	],
	
	layout: 'fit',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.panelId,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki';
		
		/**
 		 * @property
 		 */
		me.chartDescription = '<b>Multi-Level Pie Chart</b>';
			
		/**
 		 * @properties
 		 * @description layout vars
 		 */
		me.width = parseInt(Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		me.dockedItems = [{
		 	xtype: 'toolbar',
		 	dock: 'top',
		 	items: [{
			 	xtype: 'button',
			 	cls: me.btnHighlightCss,
			 	text: 'Count',
			 	handler: function() {
				 	me.radialChart.setDataMetric(null);
				 	me.radialChart.transition();
				},
				scope: me
			},
			'-',
			{
				xtype: 'button',
				text: 'Career Wins',
			 	handler: function() {
				 	me.radialChart.setDataMetric('wins');
				 	me.radialChart.transition();
				},
				scope: me
			}, 
			'-',
			{
				xtype: 'button',
				text: 'Majors',
			 	handler: function() {
				 	me.radialChart.setDataMetric('majors');
				 	me.radialChart.transition();
				},
				scope: me
			}]
		}];
		
		// on activate, publish update to the "Info" panel
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		// after render, initialize the canvas
		me.on('afterrender', function(panel) {
			me.initCanvas();
		}, me);
		
		me.callParent(arguments);
	},
	
	/**
	 * @function
	 * @memberOf App.view.d3.pie.MainPanel
	 * @description Initialize SVG drawing canvas
	 */
	initCanvas: function() {
		var me = this;
	 	
	 	me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
 			me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
 			
 		me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight)
	 		.attr('transform', 'translate(' + Math.floor(me.canvasWidth/2) + ',' + Math.floor(me.canvasHeight/2) + ')');
	 	
	 	/*var radius = 100;
		var partition = d3.layout.partition()
    		.sort(null)
    		.size([2 * Math.PI, radius * radius])
    		.value(function(d) { return 1; });*/
	 		
	 	Ext.Ajax.request({
		 	url: 'data/golfers.json',
		 	method: 'GET',
		 	success: function(response) {
				
				var resp = Ext.JSON.decode(response.responseText);
				// console.debug(partition.nodes(resp)[0]);
				
	 			
	 			me.radialChart = Ext.create('App.util.d3.final.RadialTree', {
		 			svg: me.svg,
		 			canvasWidth: me.canvasWidth,
		 			canvasHeight: me.canvasHeight,
		 			graphData: resp,
		 			panelId: me.panelId
		 		}, me);
	 			
	 			me.radialChart.draw();
	 		},
	 		scope: me
	 	});

	 	
	 	/*
	 	function stash(d) {
  			d.x0 = d.x;
  			d.dx0 = d.dx;
		}
		
		function arcTween(a) {
			var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
			return function(t) {
				var b = i(t);
				a.x0 = b.x;
				a.dx0 = b.dx;
				return arc(b);
			};
		}
	 	
	 	// initialize SVG, width, height
 		me.svgInitialized = true,
 			me.canvasWidth = Math.floor(me.body.dom.offsetWidth * .98),
 			me.canvasHeight = Math.floor(me.body.dom.offsetHeight * .98),
 			me.panelId = '#' + me.body.id;
	 	
	 	// init svg
		me.svg = d3.select(me.panelId)
	 		.append('svg')
	 		.attr('width', me.canvasWidth)
	 		.attr('height', me.canvasHeight)
	 		.attr('transform', 'translate(' + Math.floor(me.canvasWidth/2) + ',' + Math.floor(me.canvasHeight/2) + ')');
	 		
	 	var radius = Math.min(me.canvasWidth, me.canvasHeight) / 3,
    		color = d3.scale.category20c();
    		
    	var partition = d3.layout.partition()
    		.sort(null)
    		.size([2 * Math.PI, radius * radius])
    		.value(function(d) { return 1; });
    		
    	var arc = d3.svg.arc()
    		.startAngle(function(d) { return d.x; })
    		.endAngle(function(d) { return d.x + d.dx; })
    		.innerRadius(function(d) { return Math.sqrt(d.y); })
    		.outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
    		
    	// WORKS !!!!!!!
    	var path = me.svg.datum(me.getData())
    		.selectAll('path')
    		//.data(partition.nodes)  // count
    		.data(partition.value(function(d) { return d.miles; }).nodes)
	    	.enter()
	    	.append('path')
			.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
			.attr("d", arc)
			.style("stroke", "#fff")
			.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
			.style("fill-rule", "evenodd")
			.each(stash)
			.on('mouseover', function(d, i) {
				path.data(partition.value(function(d) { return 1; }).nodes)
					.transition()
					.duration(500)
					.attrTween('d', arcTween);
			});
*/
			
/*			path
        .data(partition.value(value).nodes)
      .transition()
        .duration(1500)
        .attrTween("d", arcTween);
			
			});*/
	},
	
	/**
 	 * @function
 	 * @description Stub data
 	 */
	getData: function() {
	 	
	 	return {
		 	name: 'flare',
		 	children: [{
			 	name: 'Maryland',
			 	children: [{
				 	name: 'Railways',
				 	miles: 100
				}, {
					name: 'Roadways',
					miles: 200
				}, {
					name: 'Waterways',
					miles: 300
				}]
			}, {
				name: 'Virginia',
			 	children: [{
				 	name: 'Railways',
				 	miles: 100
				}, {
					name: 'Roadways',
					miles: 200
				}, {
					name: 'Waterways',
					miles: 300
				}]
			}, {
				name: 'Delaware',
			 	children: [{
				 	name: 'Railways',
				 	miles: 100
				}, {
					name: 'Roadways',
					miles: 200
				}, {
					name: 'Waterways',
					miles: 300
				}]
			}]
		};
		
	}
});