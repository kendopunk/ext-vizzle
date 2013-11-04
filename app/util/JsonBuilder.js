/**
 * @class
 * @memberOf App.util
 * @description Helper functions for building JSON out of store records
 */
Ext.define('App.util.JsonBuilder', {
	statics: {
		
		/**
 		 * @function
 		 * @memberOf App.util.JsonBuilder
 		 * @description Convert movie store data to consumable JSON object
 		 */
		buildMovieDataJson: function(records) {
			var ret = [];
			
			if(records.length == 0) {
				return ret;
			}
			
			Ext.each(records, function(item) {
				ret.push({
					title: item.data.title,
					gross: item.data.gross,
					theaters: item.data.theaters,
					opening: item.data.opening,
					release: item.data.release,
					imdbRating: item.data.imdbRating
				});
			});
			
			return ret;
		}
	}
});