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
			me.eventRelay = Ext.create('App.util.MessageBus'),
			me.currentOpacity = '1',
			me.currentAngle = 0,
			me.btnHighlightCss = 'btn-highlight-peachpuff';
			
		me.chartDescription = '<b>Fabric.js</b><br><br>'
			+ 'Fabric.js provides an object model on top of the canvas element.<br><br>'
			+ 'Features include SVG-to-canvas and canvas-to-SVG parsers and a built-in interactivity layer (try moving/resizing objects).<br><br>'
			+ 'Double click an image from the right panel.....Howww-Deeeeeee !!';
		
		// width/height of main panel
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95);
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight - 20);
		
		// opacity combo
    	me.opacityCombo = Ext.create('Ext.form.field.ComboBox', {
    		disabled: true,
    		store: Ext.create('Ext.data.SimpleStore', {
				fields: ['value'],
				data: [
					['1'],['0.9'],['0.8'],['0.7'],['0.6'],
					['0.5'],['0.4'],['0.3']
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
				 	me.currentOpacity = combo.getValue();
				 	
				 	Ext.each(me.canvas.getObjects(), function(obj) {
					 	obj.setOpacity(combo.getValue());
					}, me);
					
					me.canvas.renderAll();
			 	},
			 	scope: me
			}
		});
		
		// angle combo
    	me.angleCombo = Ext.create('Ext.form.field.ComboBox', {
    		disabled: true,
    		store: Ext.create('Ext.data.SimpleStore', {
				fields: ['value'],
				data: [
					[180],[90],[45],[0],
					[-45],[-90]
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
		 	value: '0',
		 	listeners: {
			 	select: function(combo) {
				 	me.currentAngle = combo.getValue();
				 	
				 	Ext.each(me.canvas.getObjects(), function(obj) {
					 	obj.setAngle(combo.getValue());
					}, me);
					
					me.canvas.renderAll();
			 	},
			 	scope: me
			}
		});
		
		// drawing mode
		me.drawingModeButton = Ext.create('Ext.button.Button', {
			text: 'Drawing is OFF',
			currentValue: 'off',
			tooltip: 'Enable drawing mode',
			handler: function(btn) {
				if(btn.currentValue == 'off') {
					me.canvas.isDrawingMode = true;
					
					btn.currentValue = 'on';
					btn.setText('Drawing is ON'),
					btn.addCls(me.btnHighlightCss);
					
					me.dataViewPanel.getEl().mask();
					
					me.disableButtons(true);
				} else {
					me.canvas.isDrawingMode = false;
					
					btn.currentValue = 'off';
					btn.setText('Drawing is OFF'),
					btn.removeCls(me.btnHighlightCss);
					
					me.dataViewPanel.getEl().unmask();
					
					me.disableButtons(false);
				}
			},
			scope: me
		});
			
		// erase all button
		me.eraseAllButton = Ext.create('Ext.button.Button', {
			text: 'Erase All',
			disabled: true,
			iconCls: 'icon-eraser',
			handler: function() {
			
				me.canvas.clear().renderAll();
				
				me.disableButtons(true);
			},
			scope: me
		});
		
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
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
	    			xtype: 'tbtext',
	    			text: '<b>Opacity:</b>'
	    		}, 
	    			me.opacityCombo,
	    		{
					xtype: 'tbspacer',
					width: 20
				}, {
					xtype: 'tbtext',
					text: '<b>Angle:</b>'
				},
					me.angleCombo,
					'->',
					me.drawingModeButton,
					'-',
					me.eraseAllButton
				]
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
			title: 'Double Click Element',
			region: 'center',
			bodyStyle: {
				padding: '5px'
			},
			width: 150,
			height: me.height,
			autoScroll: true,
			items: Ext.create('Ext.view.View', {
				store: me.dataViewStore,
				tpl: [
					'<tpl for=".">',
						'<div class="thumb-wrap" id="{name}" style="margin-left:auto; margin-right:auto; text-align:center; margin-top:10px;">',
							'<div class="thumb"><img src="app/resources/img/canvas/{file}" title="{name}" width="70"></div>',
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
			var src = 'app/resources/img/canvas/' + record.data.file;
			fabric.Image.fromURL(src, function(img) {
				img.setTop(Math.floor(Math.random() * canvasHeight/2));
				img.setLeft(Math.floor(Math.random() * canvasWidth/2));
				img.scale(0.75);
				img.setOpacity(me.currentOpacity);
				img.setAngle(me.currentAngle);
				
				me.canvas.add(img);
			});
			
			me.disableButtons(false);
			
			return;
		}
		
		if(record.data.chartTarget == 'rect') {
			me.canvas.add(new fabric.Rect({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				width: Math.floor(Math.random() * 150),
				height: Math.floor(Math.random() * 150),
				opacity: me.currentOpacity,
				angle: me.currentAngle
			}));
			
			me.disableButtons(false);
			
			return;
		}
		
		if(record.data.chartTarget == 'circle') {
			me.canvas.add(new fabric.Circle({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				radius: Math.floor(Math.random() * 100) + 5,
				opacity: me.currentOpacity,
				angle: me.currentAngle
			}));
			
			me.disableButtons(false);
			
			return;
		}
		
		if(record.data.chartTarget == 'triangle') {
			me.canvas.add(new fabric.Triangle({
				top: Math.floor(Math.random() * canvasHeight/2),
				left: Math.floor(Math.random() * canvasWidth/2),
				fill: '#' + Math.floor(Math.random()*16777215).toString(16),
				width: Math.floor(Math.random() * 75) + 10,
				height: Math.floor(Math.random() * 75) + 10,
				opacity: me.currentOpacity,
				angle: me.currentAngle
			}));
			
			me.disableButtons(false);
			
			return;
		}
	},
	
	/**
 	 * @function
 	 * @description Enable the canvas toolbar buttons
 	 */
	disableButtons: function(bool) {
		var me = this;
		
		me.opacityCombo.setDisabled(bool);
		me.angleCombo.setDisabled(bool);
		me.eraseAllButton.setDisabled(bool);
	}
});
