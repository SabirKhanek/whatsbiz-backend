const { db } = require('./')

// QUERY TO CHECK IF CHAT EXISTS (WILL BE USED LATER)
const queryGetMessageId = db.prepare(`SELECT id FROM chat WHERE id = ? or chatMessage = ?`);
// END

const queryInsertIntoClassifiedMessages = db.prepare(`INSERT INTO CLASSIFIED_MESSAGES (message, intent) VALUES (?, ?)`);
const queryUpdateClassifiedMessages = db.prepare(`UPDATE CLASSIFIED_MESSAGES SET intent = ? WHERE message = ?`);
const queryGetClassifiedMessage = db.prepare(`SELECT message FROM CLASSIFIED_MESSAGES WHERE message = ?`);

const queryInsertIntoNewMessages = db.prepare(`INSERT INTO NEW_MESSAGES (message_body) VALUES (?)`)

const queryGetNewMessages = db.prepare(`SELECT * FROM NEW_MESSAGES`);

const queryDeleteNewMessages = db.prepare(`DELETE FROM NEW_MESSAGES`);

const queryInsertChat = db.prepare(`INSERT INTO chat (id ,chatId, chatName, chatType, chatMessage, chatMessageAuthor, chatMessageTime) VALUES (?,?, ?, ?, ?, ?, ?)`);

const queryInsertProduct = db.prepare(`INSERT INTO PRODUCT (intent, chatId, name, type, quantity, ram, storage, processor, brand, price, remarks, condition, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const queryInsertProcessedMessage = db.prepare(`INSERT INTO PROCESSED_MESSAGES (message_id) VALUES (?)`)




const registerClassifiedMessage = (message, intent) => {
    const messageInDb = queryGetClassifiedMessage.get(message);
    if (messageInDb) {
        queryUpdateClassifiedMessages.run(intent, message);
    } else {
        queryInsertIntoClassifiedMessages.run(message, intent);
    }
}

const saveIntent = (intent) => {
    // INSERT CHAT
    queryInsertChat.run(intent.id, intent.chatId, intent.chatName, intent.chatType, intent.chatMessage, intent.chatMessageAuthor, intent.chatMessageTime);
    // END

    // INSERT PRODUCT
    intent.products.forEach(product => {
        const { lastInsertRowid: insertedPrdId } = queryInsertProduct.run(
            product.intent,
            intent.id,
            product.name.toLowerCase(),
            !['n/a', 'N/A', ''].includes(product.type) && product.type !== undefined ? product.type.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.quantity) && product.quantity !== undefined ? product.quantity.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.ram) && product.ram !== undefined ? product.ram.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.storage) && product.storage !== undefined ? product.storage.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.processor) && product.processor !== undefined ? product.processor.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.brand) && product.brand !== undefined ? product.brand.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.price) && product.price !== undefined ? product.price.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.remarks) && product.remarks !== undefined ? product.remarks.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.condition) && product.condition !== undefined ? product.condition.toLowerCase() : '-',
            !['n/a', 'N/A', ''].includes(product.color) && product.color !== undefined ? product.color.toLowerCase() : '-'
        );
    });
}

function ifMessageExist(id = 0, body) {
    const messageInDb = queryGetMessageId.get(id, body);
    if (messageInDb) return true
    else false
}

function getMessageIds() {
    const query = db.prepare(`SELECT message_id AS id FROM PROCESSED_MESSAGES`);
    const messagesIdsObjs = query.all();
    return _(messagesIdsObjs).map(message => message.id).value()
}

function saveIntents(intents) {
    const totalIntents = intents.length;
    let saved = 0;


    intents.forEach(intent => {
        const messageInDb = queryGetMessageId.get(intent.id, intent.chatMessage);
        if (messageInDb) {
            console.log(`Message "${intent.chatMessage.substring(0, 20).replace('\n', ' ')}" already exists in database. Skipping...`)
            return;
        }

        try {
            db.transaction(saveIntent)(intent);
            saved++;
        } catch (err) {
            console.log(`ERROR while SAVING INTENT: ${err}`);
            // console.log(`intent: ${JSON.stringify(intent)}`);
        }
    });

    console.log(`Saved ${saved} from ${totalIntents}`)
    return saved;
}

function registerMessageInDB(msg_id) {
    return queryInsertProcessedMessage.run(msg_id)
}

function deleteNewMessages() {
    queryDeleteNewMessages.run()
}

function getNewMessages() {
    const messages = queryGetNewMessages.all().map(message => JSON.parse(message.message_body));
    return messages;
}

function saveNewMessage(message) {
    queryInsertIntoNewMessages.run(JSON.stringify(message))
}

module.exports.newMessages = { get: getNewMessages, save: saveNewMessage, delete: deleteNewMessages }
module.exports.saveIntents = saveIntents;
module.exports.registerMessageInDB = registerMessageInDB;
module.exports.getMessageIds = getMessageIds;
module.exports.ifMessageExist = ifMessageExist;
module.exports.registerClassifiedMessage = registerClassifiedMessage;
module.exports.execSql = (query) => {
    try {
        const result = db.prepare(query).run()
        return JSON.stringify(result)
    } catch (err) {
        return err.message
    };
};
module.exports.isClassifed = (message) => {
    const messageInDb = queryGetClassifiedMessage.get(message);
    return !!messageInDb;
}
module.exports.getUserCreds = (username) => {
    const query = db.prepare(`SELECT * FROM USER WHERE username = ?`);
    const user = query.get(username);
    return user;
}