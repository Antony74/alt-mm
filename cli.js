#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* global console process require */

const child_process = require('child_process');
const cmd = `npm start ${process.argv.slice(2)}`;
const altmm = child_process.exec(cmd);

altmm.stdout.on('data', data => {
    console.log(data);
});

altmm.stderr.on('data', data => {
    console.error(data);
});

