const db = require('../../db/controllers/images')
const mime = require('mime')
const fs = require('fs')
const sharp = require('sharp')

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

async function adjustImageResolution(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        const imageSize = Math.max(metadata.width, metadata.height);

        // Set the desired padding (optional)
        const padding = 0;

        const squareSize = imageSize + padding;

        const imageBuffer = await sharp(filePath)
            .resize(squareSize, squareSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: true })
            .toBuffer();

        return imageBuffer;
    } catch (err) {
        console.error('Error adjusting image resolution:', err);
        return await sharp(filePath).toBuffer();
    }
}


const getImage = async (req, res) => {
    const { id } = req.params
    const { isSquare } = req.query
    if (!id) return res.status(400).send('Id is required')
    if (id === 'default') return sendNotFound(res)

    try {
        const imagePath = db.getImagePath(id)
        if (!fileExists(imagePath)) {
            return res.status(404).send('Image not found');
        }
        const mimeType = mime.getType(imagePath)
        res.setHeader('Content-Type', mimeType);
        if (isSquare === 'true') {
            const imageBuffer = await adjustImageResolution(imagePath);
            return res.send(imageBuffer);
        } else {
            fs.createReadStream(imagePath).pipe(res);
        }
    } catch (error) {
        sendNotFound(res)
    }
}

function sendNotFound(res) {
    if (!fileExists(__dirname + '/404.jpg')) {

        res.status(404).send(error.message)
    } else {
        res.setHeader('Content-Type', 'image/jpeg');
        fs.createReadStream(__dirname + '/404.jpg').pipe(res);
    }
}

const deleteImage = (req, res) => {
    const { id } = req.query
    if (!id) return res.status(400).send('Id is required')
    if (id === 'default') return res.status(400).send('Can not delete default image')
    try {
        db.deleteImage(id)
        res.status(200).send('Image deleted successfully')
    } catch (error) {
        res.status(500).send(error.message)
    }
}

module.exports.getImage = getImage
module.exports.deleteImage = deleteImage