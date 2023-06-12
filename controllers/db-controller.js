const db = require('../db/dbHandler')
const db_get_excel = require('../db/query2xl')

module.exports.getExcelPath = async (req, res) => {
    const path = await db_get_excel.getExcelPath()
    res.download(path)
}

module.exports.getProducts = (req, res) => {
    try {
        const { intent, name, author, messagetime } = req.query;
        const products = db.getProducts(intent, name, author, messagetime);
        res.json(products);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}