/**
 * @class
 * @memberOf App.view.d3.bar
 * @description SVG panel
 * @extend Ext.panel.Panel
 */
Ext.define('App.view.d3.bar.GridPanel', {
	extend: 'Ext.grid.Panel',
	plain: true,
	autoScroll: true,
	title: 'Grid',
	
	initComponent: function() {
		var me = this;
		
		/**
 		 * event relay
 		 */
 		me.eventRelay = Ext.create('App.util.MessageBus');
 		me.eventRelay.subscribe('barGridPanelRowHighlight', me.gridRowHighlight, me);
		
		/**
 		 * @property
 		 * @description Column definitions
 		 */
 		me.columns = [
 			App.util.ColumnDefinitions.movieTitle,
 			App.util.ColumnDefinitions.grossBO,
 			App.util.ColumnDefinitions.numTheaters,
 			App.util.ColumnDefinitions.openingBO,
 			App.util.ColumnDefinitions.releaseDate,
 			App.util.ColumnDefinitions.imdbRating
		];
		
		me.callParent(arguments);
	},
	
	/**
 	 * @function
 	 * @memberOf App.view.d3.bar.GridPanel
 	 * @param obj Generic obj {title: ''}
 	 * @description Attempt to highlight a grid row based on a movie title value
 	 */
	gridRowHighlight: function(obj) {
		var me = this;
		
		console.debug(obj);
		
		var record = me.getStore().findRecord('title', obj.value);
		if(record) {
			var rowIndex = me.getStore().indexOf(record);
			me.getSelectionModel().select(rowIndex);
		}
	}
});