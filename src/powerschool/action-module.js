const ActionModule = require('../action-module');

module.exports = new ActionModule({
	'auth': require('./auth'),
	'fetch': require('./fetch')
});
