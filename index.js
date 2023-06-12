require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
require('./sockets')(io);
const client = require('./whatsapp-client').init()
const apiRouter = require('./routes')
const cors = require('cors')
const db = require('./db/dbHandler')

app.use(cors())
app.use(express.json())
app.use('/api', apiRouter)
app.use('/auth', require('./routes/auth'))
app.use('/', express.static('public'))

// Start the server
const port = 3000; // Choose your desired port number
http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

