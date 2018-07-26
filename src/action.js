const Schema = require('./schema');

class Action {
    constructor(schema, action) {
        this.schema = new Schema(schema);
        this.action = action;
    }

    async run(session, options) {
        this.schema.validate(options);
        await this.action(session, options);
    }
}

module.exports = Action;
