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
        this.inputBuffer = [];
        this.handleSend = this.options.handleSend;
        this.directory = path.join(this.options.directory, this.id);

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

    async close() {
        await this.browser.close();
    }

    receive(message) {
        this.inputBuffer.push(message);
    }

    async getInput(tag, schemas) {
        // TODO tags for input
        if (this.inputBuffer.length === 0) {
            await new Promise((resolve, reject) => {
                this.handleReceive = () => {
                    resolve();
                };
            });
        }
        const input = this.inputBuffer.shift();
        const {tag: inputTag, ...inputWithoutTag} = input;
        if (inputTag !== tag) {
            throw new Error(`tags do not match: input=${inputTag}, desired=${tag}`);
        }
        if (schemas === undefined) {
            inputSchema.validate(input);
        } else {
            inputSchema.compose(schemas[tag]).validate(input);
        }
        return inputWithoutTag;
    }

    async getOptionsInput(schemas) {
        return await this.getInput('OPTIONS', schemas);
    }

    send(message, schema) {
        if (schema === undefined) {
            outputSchema.validate(message);
        } else {
            outputSchema.compose(schema).validate(message);
        }
        this.handleSend(message);
    }

    sendResult(tag, result, schemas) {
        this.send({
            type: 'RESULT',
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

    sendActionStatus(status) {
        this.send({
            type: 'ACTION_STATUS',
            status: status
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

    async takeScreenshot(options) {
        const resource = this.createResource('png');
        await this.page.screenshot({
            path: resource.path,
            ...options
        });
        return resource;
    }

    createResource(extension) {
        return new Resource(this, extension);
    }

    async runAction(action) {
        this.sendActionStatus('STARTED');
        await action.run(this);
        this.sendActionStatus('FINISHED');
    }
}

const outputSchema = new Schema(`
type=RESULT|LOG|RESOURCE|ERROR|ACTION_STATUS
type=LOG|ERROR?: message=string
type=RESOURCE?: =<resource>
type=RESOURCE|RESULT?: tag
type=ACTION_STATUS?: status=STARTED|FINISHED
`, {
    resource: Resource.serializeSchema
});

const inputSchema = new Schema(`
tag=string
`);

module.exports = Session;
module.exports.outputSchema = outputSchema;
