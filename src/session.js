/* eslint no-console: 0 */

const utils = require('./utils');
const Resource = require('./resource');
const Schema = require('./schema');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

class Session {
    constructor(options) {
        this.id = utils.createID();
        this.options = options || {};
        this.state = {};
        this.directory = path.join(options.directory, this.id);

        if (!fs.existsSync(this.directory)){
            mkdirp.sync(this.directory);
        }
    }

    async start() {
        let browserOptions = {};
        if (this.options.headless === true) {
            browserOptions.headless = true;
        } else {
            browserOptions.headless = false;
        }
        const {browser, page} = await utils.startBrowser(browserOptions);
        this.browser = browser;
        this.page = page;
    }

    async end() {
        await this.browser.close();
    }

    send(response, schema) {
        if (schema === undefined) {
            outputSchema.validate(response);
        } else {
            outputSchema.compose(schema).validate(response);
        }
        console.log('Sending: ', response);
    }

    sendOutput(tag, output, schemas) {
        this.send({
            type: 'OUTPUT',
            tag,
            ...output
        }, schemas === undefined ? undefined : schemas[tag]);
    }

    sendLog(message) {
        this.send({
            type: 'LOG',
            message
        });
    }

    sendResource(tag, resource) {
        this.send({
            type: 'RESOURCE',
            tag,
            ...resource.serialize()
        });
    }

    sendError(message) {
        this.send({
            type: 'ERROR',
            message
        });
    }

    takeScreenshot(options) {
        const resource = this.createResource('png');
        this.page.screenshot({
            path: resource.path,
            ...options
        });
        return resource;
    }

    createResource(extension) {
        return new Resource(this, extension);
    }
}

const outputSchema = new Schema(`
type=OUTPUT|LOG|RESOURCE|ERROR
type=LOG|ERROR?: message=string
type=RESOURCE?: <resource>
type=RESOURCE|OUTPUT?: tag
`, {
    resource: Resource.serializeSchema
});

module.exports = Session;
module.exports.outputSchema = outputSchema;
