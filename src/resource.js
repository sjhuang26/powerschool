const utils = require('./utils');
const path = require('path');

class Resource {
    constructor(session, extension) {
        this.id = utils.createID();
        this.file = this.id + '.' + extension;
        this.sessionDirectory = session.directory;
        this.path = path.join(this.sessionDirectory, this.file);
    }

    serialize() {
        return {
            id: this.id,
            path: this.path
        };
    }
}

module.exports = Resource;
