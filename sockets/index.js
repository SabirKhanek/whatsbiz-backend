const client = require('../whatsapp-client');

module.exports = (io) => {
    client.ev.on('wa-qr', (qr) => {
        console.log('qr', qr);
        io.emit('wa-qr', qr);
    });

    client.ev.on('wa-connecting', () => {
        io.emit('wa-connecting');
        console.log('connecting');
    });

    client.ev.on('wa-connected', (user) => {
        console.log('connected', user);
        io.emit('wa-connected', user);
    });

    client.ev.on('wa-disconnected', (reason) => {
        console.log('disconnected', reason);
        io.emit('wa-disconnected', reason);
    });

    client.ev.on('new-text-message', (message) => {
        console.log('new-text-message', message);
        io.emit('new-text-message', message);
    });
};
