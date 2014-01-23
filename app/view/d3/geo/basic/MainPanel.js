/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.geo.basic
 * @description Basic mapping / geo panel
 */
Ext.define('App.view.d3.geo.basic.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.geoBasicMainPanel',
	title: 'Basic Geo',
	closable: true,
	
	requires: [
		'App.util.d3.geo.Us',
		'App.util.MessageBus'
	],
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * @properties
 		 * @description SVG properties
 		 */
 		me.svgInitialized = false,
	 		me.originalGraphData = [],
 			me.graphData = [],
 			me.canvasWidth,
 			me.canvasHeight,
 			me.svg,
 			me.gTitle,
 			me.gCircle,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.btnHighlightCss = 'btn-highlight-khaki',
 			me.width = 
 				parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
 			me.height = 
	 			parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
	 		me.usMapRenderedEvent = 'geoBasicRendered',
	 		me.yearFilter = ['195'],
	 		me.usMap = Ext.create('App.util.d3.geo.Us', {
		 		fill: '#ECEECE',
		 		mouseOverFill: '#CCCC99',
		 		mapRenderedEvent: me.usMapRenderedEvent
		 	}, me);
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>Basic Geo</b>';
		
		/**
 		 * @property
 		 * @description Search button
 		 */
 		me.searchButton = Ext.create('Ext.button.Button', {
	 		iconCls: 'icon-magnify',
	 		tooltip: 'Search',
	 		text: 'Search'
	 	});
		
		/**
 	 	 * @property
 	 	 * @description Docked items
 	 	 */
 	 	 /*,
		 	 	listeners: {
			 	 	change: function(field) {
				 	 	console.log(field.checked);
				 	 	console.debug(field.inputValue);
				 	}
				 }*/
 	 	me.dockedItems = [{
	 	 	xtype: 'toolbar',
	 	 	dock: 'top',
	 	 	items: [{
		 	 	xtype: 'tbspacer',
		 	 	width: 10
		 	}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1950-59',
		 	 	name: 'years',
		 	 	inputValue: '195',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1960-69',
		 	 	name: 'years',
		 	 	inputValue: '196',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1970-79',
		 	 	name: 'years',
		 	 	inputValue: '197',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1980-89',
		 	 	name: 'years',
		 	 	inputValue: '198',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1990-99',
		 	 	name: 'years',
		 	 	inputValue: '199',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '2000-09',
		 	 	name: 'years',
		 	 	inputValue: '200',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '2010-13',
		 	 	name: 'years',
		 	 	inputValue: '201',
		 	 	checked: true
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 20
			},
				me.searchButton
			]
		}];
		
		/**
 		 * @listener
 		 * @description On activate, publish update to the "info" panel
 		 */
		me.on('activate', function() {
			me.eventRelay.publish('infoPanelUpdate', me.chartDescription);
		}, me);
		
		/**
 		 * @listener
 		 * @description After rendering, initialize the map and execute
 		 * other drawing functionality
 		 */
 		me.on('afterrender', me.initCanvas, me);
 		
 		/**
  		 * @listener
  		 * @description After the map template has been, execute the overlay functionality
  		 */
  		me.eventRelay.subscribe(me.usMapRenderedEvent, me.initData, me);

 		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @description Initialize the canvas, map, etc.
 	 */
 	initCanvas: function(panel) {
	 	var me = this;
	 	
		me.canvasWidth = parseInt(me.width * .95);
		me.canvasHeight = parseInt(me.height * .95);
		me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
		me.svgInitialized = true;
		
		// title "g"
		me.titleG = me.svg.append('svg:g');
		
		// circle "g"
		me.gCircle = me.svg.append('svg:g');
		
		// set map properties
		me.usMap.setSvg(me.svg);
		me.usMap.setCanvasDimensions(me.canvasWidth, me.canvasHeight);
		me.usMap.draw();
	},
	
	/**
 	 * @function
 	 * @description Data initialization
 	 */
	initData: function() {
		var me = this;
		
		Ext.Ajax.request({
			url: 'data/tornado.json',
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				
				me.originalGraphData = resp.data;
				me.graphData = me.filterData(resp.data);
				
				me.draw();
			},
			scope: me
		});
	},
	
	filterData: function(dat) {
		var me = this,
			ret = [];
			
		Ext.each(dat, function(d) {
			if(me.yearFilter.indexOf(d.year.toString().substr(0, 3)) >=0) {
				ret.push(d);
			}
		}, me);
		
		return ret;
	},
	
	draw: function() {
		var me = this;
		
		// local scope
		var usMap = me.usMap;
		
		
		me.svg.selectAll('circle')
			.data(me.graphData)
			.enter()
			.append('circle')
			.attr('cx', function(d, i) {
				return usMap.getMapCoords(d.long, d.lat)[0];
			})
			.attr('cy', function(d, i) {
				return usMap.getMapCoords(d.long, d.lat)[1];
			})
			.attr('r', 3)
			.style('fill', '#990066');
	}
	
	
	
	
	
	
	
});