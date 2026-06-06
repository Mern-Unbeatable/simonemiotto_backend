const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const emailEmitter = new MyEmitter();

module.exports = emailEmitter;
