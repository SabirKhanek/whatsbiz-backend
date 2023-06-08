const client = require('../whatsapp-client')

exports.isWAConnected = (req, res) => {
    res.send({ result: client.isWAConnected() });
};

exports.restartWA = (req, res) => {
    client.restart();
    res.send({ result: 'ok' });
};

exports.sendMessage = async (req, res) => {
    try {
        if (!req.body.number.split('@')[1]) req.body.number = req.body.number + '@s.whatsapp.net';
        await client.sendTextMessage(req.body.number, req.body.message);
        res.send({ result: 'ok' });
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message });
    }
};

exports.logoutWA = (req, res) => {
    client.logout();
    res.send({ result: 'ok' });
};

