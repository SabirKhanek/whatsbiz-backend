const EventEmitter = require('events');
const ev = new EventEmitter()

ev.on('configUpdated', (data) => console.log(data))

module.exports = ev;