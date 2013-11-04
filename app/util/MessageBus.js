/**
 * @class
 * @memberOf App.util
 * @description Universal event relay / messaging bus class 
 * @extend Ext.util.Observable
 */
Ext.define('App.util.MessageBus', {
	extend: 'Ext.util.Observable',
	alias: 'widget.messagebus',
	
	constructor: function(config) {
		Ext.apply(this, config || {});
		
		App.util.MessageBus.superclass.constructor.call(this);
	},
	
	events: {},
	
	publish: function (topic /* ,variable arguments ,,, */) {
		var t = String(topic);
		this.events[t] || (this.addEvents(t));
		return this.fireEvent.apply(this, [t].concat(Array.prototype.slice.call(arguments, 1)));
	},
	
	subscribe: function (eventName, handler, scope, options) {
		this.on(eventName, handler, scope, options);
	},
	
	unsubscribe: function (eventName, handler, scope) {
		this.un(eventName, handler, scope);
	},
	
	destroy: function () {
		this.clearListeners();
	}
});