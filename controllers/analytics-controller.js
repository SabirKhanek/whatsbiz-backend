const db = require('../db/dbHandler')

module.exports.getProductBuySellAnalytics = (req, res) => {
    try {
        const { time_frame } = req.query
        if (!time_frame) {
            return res.status(400).json({ message: 'Time frame not specified' })
        }
        if (time_frame !== 'daily' && time_frame !== 'monthly') {
            return res.status(400).json({ message: 'Time frame not supported' })
        }
        const response = db.getProductAnalytics(time_frame)
        res.send(response)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}