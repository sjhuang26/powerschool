/* eslint no-console: 0 */

const utils = require('./utils');
const Resource = require('./resource');
const path = require('path');
const fs = require('fs');

class Session {
    constructor(options) {
        this.id = utils.createID();
        this.options = options || {};
        this.state = {};
        this.directory = path.join(options.directory, this.id);

        if (!fs.existsSync(this.directory)){
            fs.mkdirSync(this.directory);
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

    send(type, payload) {
        let response = {
            type: type,
            ...payload
        };
        console.log('Sending: ', response);
    }

    sendResult(result) {
        this.send('RESULT', result);
    }

    sendLog(message) {
        this.send('LOG', {
            message: message
        });
    }

    sendImage(resource) {
        this.send('IMAGE', {
            resource: resource.serialize()
        });
    }

    sendError(message) {
        this.send('ERROR', {
            message: message
        });
    }

    takeScreenshot(options) {
        const resource = this.createResource('png');
        this.page.screenshot({
            path: resource.path
        });
        return resource;
    }

    createResource(extension) {
        return new Resource(this, extension);
    }
}

module.exports = Session;
