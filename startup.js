const { setPendingToFailed } = require("./db/controllers/ads/ads");

const performTasks = async () => {
    try { setPendingToFailed() } catch (err) { console.log(err) }
}

module.exports = performTasks