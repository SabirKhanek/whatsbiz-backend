const db = require('../db/dbHandler');
const { validate } = require('../schemas/user-auth-creds');
const jwt = require('jsonwebtoken');

exports.authenticate = async (req, res) => {
    try {
        const validation = validate(req.body);
        if (validation.error) {
            res.status(400).send({ result: 'error', message: validation.error.message });
            return;
        }
        const userInDb = db.getUserCreds(req.body.username);

        if (!userInDb) {
            res.status(400).send({ result: 'error', message: 'Invalid username or password' });
            return;
        }

        if (userInDb.password !== req.body.password) {
            res.status(401).send({ result: 'error', message: 'Invalid password' });
            return;
        }

        const token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET);
        res.send({ jwt: token });
        return;
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message });
    }
}

exports.validateToken = function validateJWT(req, res, next) {
    const token = req.headers.authorization;
    console.log('token', req.headers)

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        // Store the decoded token in the request object for future use
        req.user = decoded;
        next();
    });
}