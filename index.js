const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
require('./sockets')(io);
const client = require('./whatsapp-client').init()
const apiRouter = require('./routes')

app.use(express.json())
app.use('/', express.static('public'))
app.use('/api', apiRouter)

// Start the server
const port = 3000; // Choose your desired port number
http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

