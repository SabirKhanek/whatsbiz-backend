require('dotenv').config()
require('./utils/config-mgmt').applyDefault()
const storage_mount = (process.env.storage_mount && fs.existsSync(process.env.storage_mount)) ? process.env.storage_mount : '/mnt/storage'
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
require('./sockets')(io);
const client = require('./whatsapp-client').init()
const apiRouter = require('./routes')
const cors = require('cors')
const db = require('./db/dbHandler');
const morgan = require('morgan');
require('./utils/new_message_cron').initCronJob()

if (process.env.NODE_ENV === 'production') {
    // app.use(express.static('client/build'));
    // Install pip packages in production server
    require('./pip_installer')().then(() => {

    }).catch((err) => {
        console.log(err)
    })

} else if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


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

