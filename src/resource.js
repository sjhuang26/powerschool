const utils = require('./utils');
const Schema = require('./schema');
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

const serializeSchema = new Schema(`
id=string
path=string
`);

module.exports = Resource;
module.exports.serializeSchema = serializeSchema;
