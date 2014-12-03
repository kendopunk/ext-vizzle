Ext.define('App.util.Env', {
	singleton: true,
	
	getEnv: function() {
		return 'dev';
		//return 'qa';
		//return 'prod';
	}
});