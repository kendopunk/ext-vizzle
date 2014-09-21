/**
 * @class
 * @author Mark Fehrenbacher (kendopunk@hotmail.com)
 * @memberOf App.view.d3.geo.basic
 * @description World map - population
 */
Ext.define('App.view.d3.geo.basic.Population', {
	extend: 'Ext.Panel',
	alias: 'widget.geoPopulation',
	title: 'World Population Stats',
	closable: true,
	
	requires: [
		'App.util.MessageBus',
		'App.util.d3.UniversalWorldMap'
	],
	
	initComponent: function() {
		var me = this;
		
		me.worldMapRendered = false,
		me.rawData = null,
		me.currentMetric = 'population',
		me.currentColor = '#CC3300',
		me.width = parseInt((Ext.getBody().getViewSize().width - App.util.Global.westPanelWidth) * .95),
		me.height = parseInt(Ext.getBody().getViewSize().height - App.util.Global.titlePanelHeight);
		
		/**
 		 * @property
 		 * @description Chart description
 		 */
		me.chartDescription = '<b>World Population Data</b><br><br>'
			+ '<i>Data from CIA World Fact Book</i>';
			
		me.metricCombo = Ext.create('Ext.form.field.ComboBox', {
			disabled: true,
			emptyText: 'Select metric...',
			store: Ext.create('Ext.data.Store', {
				fields: ['display', 'value', 'color'],
				data: [
					{display: 'Population', value: 'population', color: '#CC3300'},
					{display: 'Population Growth Rate (%)', value: 'populationGrowth', color: '#990000'},
					{display: 'Infant Mortality Rate (per 1,000 births)', value: 'infantMortality', color: '#990066'},
					{display: 'Death Rate (per 1,000)', value: 'deathRate', color: '#663300'},
					{display: 'Obesity Rate (per 1,000 adult)', value: 'obesityRate', color: '#009900'},
				]
			}),
			displayField: 'display',
			valueField: 'value',
			value: me.currentMetric,
			queryMode: 'local',
			triggerAction: 'all',
			width: 250,
			listWidth: 250,
			listeners: {
				select: function(combo, record) {
					me.currentMetric = combo.getValue();
					me.currentColor = record[0].data.color;
					me.renderMetricOverlay();
				},
				scope: me
			}
		});
		
		me.dockedItems = [{
			xtype: 'toolbar',
			dock: 'top',
			items: [{
				xtype: 'tbtext',
				text: '<b>Selected Countries By:</b>'
			},
				me.metricCombo
			]
		}];
		
		me.on('afterrender', me.initCanvas, me);
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 */
	initCanvas: function() {
		var me = this;
		
		me.canvasWidth = me.width,
			me.canvasHeight = me.height,
			me.panelId = '#' + me.body.id;
		
		// init SVG
		me.svg = d3.select(me.panelId)
			.append('svg')
			.attr('width', me.canvasWidth)
			.attr('height', me.canvasHeight);
			
		me.worldMap = Ext.create('App.util.d3.UniversalWorldMap', {
			panel: me,
			svg: me.svg,
			canvasWidth: me.canvasWidth,
			canvasHeight: me.canvasHeight,
			tooltipFunction: function(d, i) {
				return d.properties.name;
			}
		});
		
		me.worldMap.initChart();
	},
	
	/**
 	 * @function
 	 */
	panelReady: function() {
		var me = this;
		
		Ext.Ajax.request({
			url: 'data/population_metrics.json',
			method: 'GET',
			success: function(response, options) {
				var resp = Ext.decode(response.responseText);
				me.rawData = resp;
				me.worldMap.setTooltipFunction(function(d, i) {
					return d.country
						+ '<br>'
						+ Ext.util.Format.number(d.value, '0,000');
				});
				me.renderMetricOverlay();
			},
			callback: function() {
				me.metricCombo.setDisabled(false);
			},
			scope: me
		});
	},
	
	/**
	 * @function
	 */
	renderMetricOverlay: function() {
		var me = this;
		
		var dat = me.rawData.data[me.currentMetric];
		
		var opacityScale = d3.scale.linear()
			.domain([
				d3.min(dat, function(d) { return d.value;}),
				d3.max(dat, function(d) { return d.value;})
			])
			.range([.2, 1]);
			
		var map = dat.map(function(d) { return d.country; });
		
		var countrySelection = me.worldMap.gPath.selectAll('.country');
		
		// countries to highlight
		countrySelection.filter(function(e, j) {
			return map.indexOf(e.properties.name) >= 0;
		})
		.transition()
		.duration(250)
		.style('fill', me.currentColor)
		.style('opacity', function(d, i) {
			var op;
			
			var rating = dat.forEach(function(item) {
				if(item.country == d.properties.name) {
					op = opacityScale(item.value);
				}
			});
			
			return op || .2;
		});
		
		// countries to reset
		countrySelection.filter(function(e, j) {
			return map.indexOf(e.properties.name) < 0;
		})
		.style('fill', me.worldMap.countryDefaults.fill)
		.style('opacity', 1);
	}
});