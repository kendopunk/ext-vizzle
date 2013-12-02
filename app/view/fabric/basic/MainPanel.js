5/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.fabric.misc
 * @description Chart.js miscellaneous charts
 */
Ext.define('App.view.fabric.basic.MainPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.fabricBasicMainPanel',
	title: 'Fabric.js Basic',
	closable: true,
	
	requires: [
		'App.util.MessageBus'
	],
	
	layout: 'border',
	
	initComponent: function() {
		var me = this;
		
		me.canvas = null,
			me.eventRelay = Ext.create('App.util.MessageBus');
			
		me.chartDescription = '<b>Fabric.js</b><br><br>'
			+ 'Fabric.js provides an object model on top of the canvas element.<br><br>'
			+ 'Features include SVG-to-canvas and canvas-to-SVG parsers and a built-in interactivity layer (try moving/resizing objects).<br><br>'
			+ 'I\'m still wrapping my head around the API, but I really like what I see so far.';
		
		// width/height of main panel
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		// canvas panel
		me.canvasPanel = Ext.create('Ext.panel.Panel', {
			title: 'Canvas',
			region: 'west',
			width: me.width - 150,
			height: me.height,
			items: [{
				xtype: 'box',
				autoEl: {
					tag: 'canvas',
					width: me.width - 150,
					height: me.height
				}
			}]
		});
		
		// data view store
		me.dataViewStore = Ext.create('Ext.data.Store', {
			fields: [
				{name: 'name', type: 'string'},
				{name: 'file', type: 'string'},
				{name: 'chartTarget', type: 'string'}
			],
			data: [{
				name: 'Circle',
				file: 'line_art_circle.png',
				chartTarget: 'circle'
			}, {
				name: 'Rectangle',
				file: 'line_art_square.png',
				chartTarget: 'rect'
			}, {
				name: 'Triangle',
				file: 'line_art_triangle.gif',
				chartTarget: 'triangle'
			}, {
				name: 'Minnie Pearl',
				file: 'minnie.jpg',
				chartTarget: 'image'
			}, {
				name: 'Roy Clark',
				file: 'roy_clark.jpg',
				chartTarget: 'image'
			}, {
				name: 'Grandpa Jones',
				file: 'grandpa_jones.jpg',
				chartTarget: 'image'
			}]
		});
		
		// data view panel
		me.dataViewPanel = Ext.create('Ext.panel.Panel', {
			title: 'Dbl Click to Add',
			region: 'center',
			bodyStyle: {
				padding: '5px'
			},
			width: 150,
			height: me.height,
			items: Ext.create('Ext.view.View', {
				autoScroll: true,
				store: me.dataViewStore,
				tpl: [
					'<tpl for=".">',
						'<div class="thumb-wrap" id="{name}" style="margin-left:auto; margin-right:auto; text-align:center; margin-top:10px;">',
							'<div class="thumb"><img src="/extd3/app/resources/img/canvas/{file}" title="{name}" width="70"></div>',
							'<span style="margin-top:5px;">{name}</span>',
						'</div>',
					'</tpl>'
				],
				multiSelect: false,
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.thumb-wrap',
				emptyText: 'No images to display',
				listeners: {
					itemdblclick: me.viewDblClick,
					scope: me
				}
    		})
    	});
    	
		// items
		me.items = [
			me.canvasPanel,
			me.dataViewPanel
		];
		
		// top toolbar
		me.tbar = [{
			xtype: 'tbtext',
			text: '<b>Opacity:</b>'
		}, {
			xtype: 'combo',
			store: Ext.create('Ext.data.SimpleStore', {
				fields: ['value'],
				data: [
					['1'],['0.9'],['0.8'],['0.7'],['0.6'],['0.5'],['0.4']
				]
			}),
			displayField: 'value',
	 		valueField: 'value',
	 		editable: false,
		 	typeAhead: true,
		 	queryMode: 'local',
		 	triggerAction: 'all',
		 	width: 75,
		 	listWidth: 75,
		 	value: '1',
		 	listeners: {
			 	select: function(combo) {
				 	Ext.each(me.canvas.getObjects(), function(obj) {
					 	obj.setOpacity(combo.getValue());
					}, me);
					
					me.canvas.renderAll();
			 	},
			 	scope: me
			}
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
 	 * @description Initialize the fabric canvas
 	 */
	initCanvas: function() {
		var me = this;
		
		var canvasEl = new Ext.Element(me.canvasPanel.items.items[0].el.dom);
		
		me.canvas = new fabric.Canvas(canvasEl.id);
	},
		
	/**
 	 * @function
 	 * @description handle double clicks from the view
 	 */
	viewDblClick: function(view, record, item, index) {
		var me = this,
			canvasWidth = me.canvasPanel.getWidth(),
			canvasHeight = me.canvasPanel.getHeight();
		
		if(record.data.chartTarget == 'image') {
			var src = '/extd3/app/resources/img/canvas/' + record.data.file;
			fabric.Image.fromURL(src, function(img) {
				img.setTop(Math.floor(Math.random() * canvasHeight/2));
				img.setLeft(Math.floor(Math.random() * canvasWidth/2));
				img.scale(0.75);
				
				me.canvas.add(img);
			});
			
			return;
		}
		
		if(record.data.chartTarget == 'rect') {
			me.canvas.add(new fabric.Rect({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				width: Math.floor(Math.random() * 150),
				height: Math.floor(Math.random() * 150)
			}));
			
			return;
		}
		
		if(record.data.chartTarget == 'circle') {
			me.canvas.add(new fabric.Circle({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				radius: Math.floor(Math.random() * 60)
			}));
			
			return;
		}
		
		if(record.data.chartTarget == 'triangle') {
			me.canvas.add(new fabric.Triangle({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				width: Math.floor(Math.random() * 70),
				height: Math.floor(Math.random() * 70)
			}));
			
			return;
		}
	}
});