const express = require('express');
const path = require('path');
const app = express();
const util = require('util');
const exec = util.promisify(require('child_process').exec);

app.get('/api', async (req, res) => {
    console.log(`executing "${req.query.command}"`);
    const stdout = await exec(req.query.command);
    res.send(stdout);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hello-world-server.html'));
});

app.listen(80, '0.0.0.0', () => {
    console.log('[EXPRESS] Listening');
});
