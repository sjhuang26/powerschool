class Action {
    constructor(action) {
        this.action = action;
    }

    async run(session) {
        await this.action(session);
    }
}

module.exports = Action;
