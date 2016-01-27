var assign = require("lodash/assign");
var clone = require("lodash/clone");
var some = require("lodash/some");
var EventEmitter = require("events").EventEmitter;

/* Flux dispatcher */
var Dispatcher = require("../dispatcher/dispatcher");

var errorNames = require("../util/error-names");
var validateDataInput = require("../util/validate-data-input");
var ChartPropertiesStore = require("./ChartPropertiesStore");

/* Singleton that houses errors */
var _errors = { valid: true, messages: [] };
var CHANGE_EVENT = "change";

/**
 * ### ErrorStore.js
 * Store for errors/warnings to users about the bad/dumb things they are
 * probably doing
*/
var ErrorStore = assign({}, EventEmitter.prototype, {

	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},

	addChangeListener: function(callback) {
		this.on(CHANGE_EVENT, callback);
	},

	removeChangeListener: function(callback) {
		this.removeListener(CHANGE_EVENT, callback);
	},

	/**
	 * get
	 * @param k
	 * @return {any} - Return value at key `k`
	 * @instance
	 * @memberof ErrorStore
	 */
	get: function(k) {
		return _errors[k];
	},

	/**
	 * getAll
	 * @return {object} - Return all errors
	 * @instance
	 * @memberof ErrorStore
	 */
	getAll: function() {
		return clone(_errors);
	},

	/**
	 * clear
	 * Set errors to empty
	 * @instance
	 * @memberof ErrorStore
	 */
	clear: function() {
		_errors = {};
	}

});

/* Respond to actions coming from the dispatcher */
function registeredCallback(payload) {
	var action = payload.action;
	var chartProps;

	switch(action.eventName) {
		/* * Data input updated */
		case "update-data-input":

			var error_messages = [];

			Dispatcher.waitFor([ChartPropertiesStore.dispatchToken]);
			chartProps = ChartPropertiesStore.getAll();

			var inputErrors = validateDataInput(chartProps.input, chartProps.data, chartProps.scale.hasDate)
			error_messages = error_messages.concat(inputErrors);

			_errors.messages = error_messages.map(function(err_name) {
				return errorNames[err_name];
			});

			var isInvalid = some(_errors.messages, { type: 3 } );
			_errors.valid = !isInvalid;

			ErrorStore.emitChange();
			break;

		default:
			// do nothing
	}

	return true;

}

//Dispatcher.register(registeredCallback);
/* Respond to actions coming from the dispatcher */
ErrorStore.dispatchToken = Dispatcher.register(registeredCallback);
module.exports = ErrorStore;
