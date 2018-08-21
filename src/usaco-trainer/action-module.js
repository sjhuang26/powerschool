const ActionModule = require('../action-module');

module.exports = new ActionModule({
	'fetch': require('./fetch')
});
