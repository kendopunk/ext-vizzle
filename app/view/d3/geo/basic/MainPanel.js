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
 			me.gInfo,
 			me.eventRelay = Ext.create('App.util.MessageBus'),
 			me.baseTitle = 'F5/EF5 Tornadoes in the US: ',
 			me.btnHighlightCss = 'btn-highlight-khaki',
 			me.width = 
 				parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
 			me.height = 
	 			parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight),
	 		me.usMapRenderedEvent = 'geoBasicRendered',
	 		me.currentScaleFilter = 'none',
	 		me.defaultRadiusScale = function(d) { return 4; },
	 		me.radiusScale = function(d) { return 4; },
	 		me.usMap = Ext.create('App.util.d3.geo.Us', {
		 		fill: '#ECEECE',
		 		mouseOverFill: '#CCCC99',
		 		mapRenderedEvent: me.usMapRenderedEvent,
		 		mapScale: 850,
		 		translateOffsetX: -100
		 	}, me),
		 	me.circleFillFn = function(data) {
		 		switch(data.year.toString().substr(0, 3)) {
			 		case '195':
			 		return '#FF0000';
			 		break;
			 		
			 		case '196':
			 		return '#00FFFF';
			 		break;
			 		
			 		case '197':
			 		return '#CC33FF';
			 		break;
			 		
			 		case '198':
			 		return '#003366';
			 		break;
			 		
			 		case '199':
			 		return '#66FF99';
			 		break;
			 		
			 		case '200':
			 		return '#CC9900';
			 		break;
			 		
			 		default:
			 		return '#CCCCCC';
			 		break;
		 		}
		 	}
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>Basic Geo</b><br><br>'
			+ '<i>F5/EF5 Tornadoes in the US between 1950-2013.</i><br><br>'
			+ 'Check year(s) to view tornado activity.  Use Scale/Filter options ' 
			+ 'to view relative tornado magnitudes (fatalities or estimated damage). <b>Note:</b> '
			+ 'Some circles may disappear if fatality or damage data is unavailable.<br><br>'
			+ 'Mouseover circles to display tornado details.<br><br>'
			+ 'Data from Wikipedia, NOAA, and <a href="www.latlong.net">latlong.net</a> (a cool site).';
		
		/**
 		 * @properties
 		 * @description Toolbar buttons
 		 */
	 	me.noScaleButton = Ext.create('Ext.button.Button', {
	 		tooltip: 'No scale/filter',
	 		text: 'None',
	 		state: 'none',
	 		disabled: true,
	 		cls: me.btnHighlightCss,
	 		handler: me.scaleFilterHandler,
	 		scope: me
		});
	 	me.fatalitiesButton = Ext.create('Ext.button.Button', {
		 	iconCls: 'icon-skull-and-bones',
		 	tooltip: 'By fatalities',
		 	text: 'Fatalities',
		 	state: 'fatalities',
		 	disabled: true,
	 		handler: me.scaleFilterHandler,
	 		scope: me
		});
		me.damagesButton = Ext.create('Ext.button.Button', {
		 	iconCls: 'icon-dollar',
		 	tooltip: 'By total damages',
		 	text: 'Damages',
		 	state: 'damages',
		 	disabled: true,
	 		handler: me.scaleFilterHandler,
	 		scope: me
		});
		
		/**
 	 	 * @property
 	 	 * @description Docked items
 	 	 */
 	 	me.dockedItems = [{
	 	 	xtype: 'toolbar',
	 	 	dock: 'top',
	 	 	items: [{
		 	 	xtype: 'tbspacer',
		 	 	width: 10
		 	}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1950s',
		 	 	name: 'years',
		 	 	inputValue: '195',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1960s',
		 	 	name: 'years',
		 	 	inputValue: '196',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1970s',
		 	 	name: 'years',
		 	 	inputValue: '197',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1980s',
		 	 	name: 'years',
		 	 	inputValue: '198',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '1990s',
		 	 	name: 'years',
		 	 	inputValue: '199',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '2000s',
		 	 	name: 'years',
		 	 	inputValue: '200',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	}, {
			 	xtype: 'tbspacer',
			 	width: 7
			}, {
		 	 	xtype: 'checkboxfield',
		 	 	boxLabel: '2010-13',
		 	 	name: 'years',
		 	 	inputValue: '201',
		 	 	listeners: {
			 	 	change: me.checkboxChange,
			 	 	scope: me
			 	}
		 	},
		 		'->',
			{
				xtype: 'tbtext',
				text: '<b>Scale/Filter:</b>'
			},
				me.noScaleButton,
			{
				xtype: 'tbspacer',
				width: 3
			},
				me.fatalitiesButton,
			{
				xtype: 'tbspacer',
				width: 3
			},
				me.damagesButton
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
		me.canvasHeight = parseInt(me.height * .95) - 60;
		me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
		me.svgInitialized = true;
		
		// title "g"
		me.gTitle = me.svg.append('svg:g')
			.attr('transform', 'translate('
			+ parseInt(me.canvasWidth/2)
			+ ',30)');
			
		// info "g"
		var xTrans = me.canvasWidth - 200;
		me.gInfo = me.svg.append('svg:g')
			.attr('transform', 'translate(' + xTrans + ',40)');

		// set map properties
		me.usMap.setSvg(me.svg);
		me.usMap.setCanvasDimensions(me.canvasWidth, me.canvasHeight);
		me.usMap.draw();
	},
	
	/**
 	 * @function
 	 * @description Extract data via AJAX, set the working data set
 	 * and then move on to filtering
 	 */
	initData: function() {
		var me = this;
		
		Ext.Ajax.request({
			url: 'data/tornado.json',
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				
				me.originalGraphData = me.graphData = resp.data;
				
				me.draw();
			},
			scope: me
		});
	},
	
	/**
 	 * @function
 	 * @description Draw/transition the overlay tornado data (circles)
 	 */
	draw: function() {
		var me = this,
			yearFilters = [];
		
		////////////////////////////////////////
		// figure out the years to filter on
		////////////////////////////////////////
		var checkboxes = me.query('toolbar[dock=top] checkboxfield');
		if(checkboxes.length == 0) {
			return;
		}
		
		Ext.each(checkboxes, function(cbx) {
			if(cbx.checked) {
				yearFilters.push(cbx.inputValue);
			}
		});
		
		if(yearFilters.length == 0) {
			me.svg.selectAll('circle').remove();
			me.setChartTitle(me.baseTitle);
			return;
		}
		
		////////////////////////////////////////
		// filter on year selections
		////////////////////////////////////////
		var workingData = [];
		Ext.each(me.originalGraphData, function(d) {
			if(yearFilters.indexOf(d.year.toString().substr(0, 3)) >=0) {
				workingData.push(d);
			}
		}, me);
		
		////////////////////////////////////////
		// further filter on damages or fatalities
		////////////////////////////////////////
		workingData = me.runtimeFilter(workingData);
	
		////////////////////////////////////////
		// handle the title
		////////////////////////////////////////
		me.setChartTitle(me.baseTitle + 
			Ext.Array.map(yearFilters, function(y) {
				return y + '0s';
			}).join(', ')
		);

		////////////////////////////////////////
		// enable the scale/filter buttons
		////////////////////////////////////////
		me.enableScaleButtons(true);
		
		////////////////////////////////////////
		// ditch info
		////////////////////////////////////////
		me.gInfo.selectAll('text')
			.transition()
			.duration(500)
			.attr('x', 1500)
			.remove();
		
		////////////////////////////////////////
		// handle the circles
		////////////////////////////////////////
		me.handleCircles(workingData);
	},
	
	checkboxChange: function(cbx) {
		var me = this;
		
		if(cbx.checked) {
			cbx.addCls(me.btnHighlightCss);
		} else {
			cbx.removeCls(me.btnHighlightCss);
		}

		me.draw();
	},
	
	/**
 	 * @function
 	 */
	scaleFilterHandler: function(btn, evt) {
		var me = this;
		
		btn.addCls(me.btnHighlightCss);
		me.currentScaleFilter = btn.state;
		
		// change button class
		if(btn.state == 'fatalities') {
			me.noScaleButton.removeCls(me.btnHighlightCss);
			me.damagesButton.removeCls(me.btnHighlightCss);
		} else if(btn.state == 'damages') {
			me.noScaleButton.removeCls(me.btnHighlightCss);
			me.fatalitiesButton.removeCls(me.btnHighlightCss);
		} else {
			me.fatalitiesButton.removeCls(me.btnHighlightCss);
			me.damagesButton.removeCls(me.btnHighlightCss);
		}
		
		me.draw();
	},
	
	/**
	 * @function
	 */
	handleCircles: function(data) {
		var me = this;
		
		// local scope
		var usMap = me.usMap,
			radiusScale = me.radiusScale,
			currentScaleFilter = me.currentScaleFilter,
			circleFillFn = me.circleFillFn;
			
		// remove all
		me.svg.selectAll('circle').remove();
		
		// add new
		var circSelection = me.svg.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.on('mouseover', function(d) {
				me.showInfo(d);
			});
			
		// transition (radius only)
		circSelection.transition()
			.duration(500)
			.attr('cx', function(d) {
				return usMap.getMapCoords(d.long, d.lat)[0];
			})
			.style('fill', function(d) {
				return circleFillFn(d);
			})
			.attr('cy', function(d) {
				return usMap.getMapCoords(d.long, d.lat)[1];
			}).attr('r', function(d) {
				if(currentScaleFilter == 'fatalities') {
					return radiusScale(d.fatalities);
				} else if(currentScaleFilter == 'damages') {
					return radiusScale(d.damages);
				} else {
					return 4;
				}
			});
			
			
			
		
		/*// join new with old
		var circSelection = me.svg.selectAll('circle')
			.data(data);
			
		// remove old
		circSelection.exit()
			.transition()
			.duration(500)
			.attr('r', 0)
			.remove();
			
		// add new
		var newCircles = circSelection.enter()
			.append('circle')
			
			.style('stroke', 'black')
			.style('stroke-width', 1)
			.on('mouseover', function(d) {
				me.showInfo(d);
			});
		
		// transition all (radius only)
		circSelection.transition()
			.duration(500)
			.attr('cx', function(d) {
				return usMap.getMapCoords(d.long, d.lat)[0];
			})
			.style('fill', function(d) {
				return circleFillFn(d);
			})
			.attr('cy', function(d) {
				return usMap.getMapCoords(d.long, d.lat)[1];
			})
			.attr('r', function(d) {
				if(currentScaleFilter == 'fatalities') {
					return radiusScale(d.fatalities);
				} else if(currentScaleFilter == 'damages') {
					return radiusScale(d.damages);
				} else {
					return 4;
				}
			});*/
	},
	
	/**
	 * @function
	 * @description Runtime filtering and sorting based on fatalities or damages
	 */
	runtimeFilter: function(data) {
		var me = this;
		
		var ret = Ext.clone(data);
		
		if(me.currentScaleFilter == 'fatalities') {
			ret = Ext.Array.filter(ret, function(item) {
				return item.fatalities != null;
			});
			
			// sort fatalities high to low
			ret = Ext.Array.sort(ret, function(a, b) {
				if(a.fatalities > b.fatalities) {
					return -1;
				} else if(a.fatalities < b.fatalities) {
					return 1;
				}
				return 0;
			});
			
			me.radiusScale = d3.scale.linear()
				.domain([
					d3.min(ret, function(d) { return d.fatalities; }),
					d3.max(ret, function(d) { return d.fatalities; })
				])
				.range([4, 20]);
		}
		else if(me.currentScaleFilter == 'damages') {
			ret = Ext.Array.filter(ret, function(item) {
				return item.damages != null;
			});
			
			// sort damages high to low
			ret = Ext.Array.sort(ret, function(a, b) {
				if(a.damages > b.damages) {
					return -1;
				} else if(a.damages < b.damages) {
					return 1;
				}
				return 0;
			});
			
			me.radiusScale = d3.scale.linear()
				.domain([
					d3.min(ret, function(d) { return d.damages; }),
					d3.max(ret, function(d) { return d.damages; })
				])
				.range([4, 20]);
		} else {
			me.radiusScale = me.defaultRadiusScale;
		}
		
		return ret;
	},
	
	/**
 	 * @function
 	 */
	enableScaleButtons: function(bool) {
		var me = this;
		
		me.noScaleButton.setDisabled(!bool);
	 	me.fatalitiesButton.setDisabled(!bool);
	 	me.damagesButton.setDisabled(!bool);
	},

	/**
 	 * @function
 	 */
	setChartTitle: function(title) {
		var me = this;
		
		// remove
		me.gTitle.selectAll('text').remove();
		
		// add
		me.gTitle.selectAll('text')
			.data([title])
			.enter()
			.append('text')
			.style('fill', '#444444')
			.style('font-weight', 'bold')
			.style('font-family', 'sans-serif')
			.style('text-anchor', 'middle')
			.text(function(d) {
				return d;
			});
	},
	
	/**
 	 * @function
 	 * @description Show tornado information in the "gInfo" <g> element
 	 */
	showInfo: function(data) {
		var me = this;

		////////////////////////////////////////
		// build text data
		////////////////////////////////////////
		var textData = [];
		
		textData.push(data.date);
		
		textData.push(' ');

		textData.push(data.city + ', ' + data.state);
		
		textData.push(' ');
		
		var fatalities = data.fatalities == null ? 'Unknown' : Ext.util.Format.number(data.fatalities, '0,000');
		textData.push('Fatalities', '- ' + fatalities);
		
		var damages = data.damages == null ? 'Unknown' : Ext.util.Format.currency(data.damages, false, '0', false);
		textData.push('Est. Damages', '- ' + damages);
		
		////////////////////////////////////////
		// join
		////////////////////////////////////////
		var textSelection = me.gInfo.selectAll('text')
			.data(textData);
			
		////////////////////////////////////////
		// remove
		////////////////////////////////////////
		textSelection.exit().remove();
		
		////////////////////////////////////////
		// add new
		////////////////////////////////////////
		var xPos = yPos = 0;
		var newText = textSelection.enter()
			.append('text')
			.attr('x', xPos)
			.attr('y', function(d, i) {
				yPos += 12;
				return yPos;
			})
			.style('font-weight', function(d, i) {
				return i == 0 ? 'bold' : 'normal';
			});
			
		////////////////////////////////////////
		// transition
		////////////////////////////////////////
		textSelection.transition().text(String);
	}
});