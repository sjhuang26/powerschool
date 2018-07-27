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
        this.inputStack = [];
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

    pushInput(request) {
        this.inputStack.push(request);
    }

    async receiveInput(tag, schemas) {
        if (this.inputStack.length === 0) {
            throw new Error('no input on stack');
        } else {
            const request = this.inputStack.shift();
            const {tag: requestTag, ...requestWithoutTag} = request;
            if (requestTag !== tag) {
                throw new Error('tags do not match');
            }
            if (schemas === undefined) {
                inputSchema.validate(request);
            } else {
                inputSchema.compose(schemas[tag]).validate(request);
            }
            console.log('Received: ', request);
            return requestWithoutTag;
        }
    }

    async receiveOptions(schemas) {
        return await this.receiveInput('OPTIONS', schemas);
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
type=OUTPUT|LOG|RESOURCE|ERROR|ACTION_STATUS
type=LOG|ERROR?: message=string
type=RESOURCE?: =<resource>
type=RESOURCE|OUTPUT?: tag
type=ACTION_STATUS?: status=STARTED|FINISHED
`, {
    resource: Resource.serializeSchema
});

const inputSchema = new Schema(`
tag=string
`);

module.exports = Session;
module.exports.outputSchema = outputSchema;
