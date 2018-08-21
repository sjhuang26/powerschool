const ActionModule = require('../action-module');

module.exports = new ActionModule({
	'users': require('./users')
});
