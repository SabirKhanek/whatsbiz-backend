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

//products queries
const queryProducts = db.prepare(`SELECT 
    product.intent AS intent,
    product.name AS name,
    product.type AS type,
    product.brand AS brand,
    product.quantity AS quantity,
    product.condition AS condition,
    product.price AS price,
    product.remarks AS remarks,
    product.ram AS ram,
    product.color AS color,
    product.storage AS storage,
    product.processor AS processor,
    chat.chatName AS chatName,
    chat.chatMessage AS message,
    extract_phoneno(chat.chatMessageAuthor) AS author,
    datetime(chat.chatMessageTime, 'unixepoch') AS messagetime
FROM 
    Chat chat
JOIN 
    Product product ON chat.id = product.chatId
WHERE
    (:intent IS NULL OR lower(product.intent) = lower(:intent))
    AND (:name IS NULL OR lower(product.name) LIKE '%' || lower(:name) || '%')
    AND (:author IS NULL OR lower(extract_phoneno(chat.chatMessageAuthor)) LIKE lower(:author) || '%')
    AND (:messagetime IS NULL OR chat.chatMessageTime >= :messagetime)
ORDER BY chat.chatMessageTime desc`);

function getDailyAnalytics() {
    const sqlQuery = `
            WITH days(label, sort) AS (
                SELECT
                    CAST(strftime('%w', 'now', 'localtime') AS INTEGER),
                    0
                UNION ALL
                SELECT
                    CASE
                        WHEN label = 0 THEN 6
                        ELSE label - 1
                    END,
                    sort + 1
                FROM
                    days
                WHERE
                    sort < 6
            )
            SELECT
                days.label,
                COUNT(CASE WHEN lower(p.intent) = 'buy' THEN 1 END) AS nbuys,
                COUNT(CASE WHEN lower(p.intent) = 'sell' THEN 1 END) AS nsells
            FROM
                days
                LEFT JOIN (
                    SELECT
                        CAST(strftime('%w', datetime(chatMessageTime, 'unixepoch')) AS INTEGER) AS label,
                        intent
                    FROM
                        Chat
                        JOIN Product ON Chat.id = Product.chatId
                    WHERE
                        chatMessageTime >= strftime('%s', 'now', '-7 days')
                ) AS p ON days.label = p.label
            GROUP BY
                days.sort
            ORDER BY
                days.sort;
        `;

    const result = db.prepare(sqlQuery).all();

    // Define an array to map the label values to day names
    const labelMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Transform the label values to day names
    const transformedResult = result.map(item => {
        return {
            label: labelMapping[item.label],
            nbuys: item.nbuys || 0,
            nsells: item.nsells || 0
        };
    });

    // Return the extracted data
    return transformedResult;
}


function getMonthlyAnalytics() {
    const sqlQuery = `
        WITH months(month, sort) AS (
            SELECT
                strftime('%m', 'now', '-0 month'),
                0
            UNION ALL
            SELECT
                CASE
                    WHEN month = '01' THEN '12'
                    ELSE printf('%02d', CAST(month AS INTEGER) - 1)
                END,
                sort + 1
            FROM
                months
            WHERE
                sort < 11
        )
        SELECT
            months.month,
            COUNT(CASE WHEN lower(p.intent) = 'buy' THEN 1 END) AS nbuys,
            COUNT(CASE WHEN lower(p.intent) = 'sell' THEN 1 END) AS nsells
        FROM
            months
            LEFT JOIN (
                SELECT
                    strftime('%m', datetime(chatMessageTime, 'unixepoch')) AS month,
                    intent
                FROM
                    Chat
                    JOIN Product ON Chat.id = Product.chatId
                WHERE
                    chatMessageTime >= strftime('%s', 'now', '-365 days')
            ) AS p ON months.month = p.month
        GROUP BY
            months.sort
        ORDER BY
            months.sort;
    `;

    const result = db.prepare(sqlQuery).all();

    // Define an array to map the month values to month names
    const monthMapping = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Transform the month values to month names
    const transformedResult = result.map(item => {
        return {
            label: monthMapping[parseInt(item.month, 10) - 1],
            nbuys: item.nbuys || 0,
            nsells: item.nsells || 0
        };
    });

    // Return the extracted data
    return transformedResult;
}

const getProductAnalytics = (timePeriod) => {
    if (timePeriod === 'daily') {
        return getDailyAnalytics();
    } else if (timePeriod === 'monthly') {
        return getMonthlyAnalytics();
    }
}

// console.log(getProductAnalytics('daily'))

function addUser(username, password) {
    const userExists = db.prepare('SELECT COUNT(*) as count FROM USER WHERE username = ?').get(username).count > 0;

    if (userExists) {
        db.prepare('UPDATE USER SET password = ? WHERE username = ?').run(password, username);
    } else {
        db.prepare('INSERT INTO USER (username, password) VALUES (?, ?)').run(username, password);
    }
}

module.exports.addUser = addUser;

module.exports.getProductAnalytics = getProductAnalytics;

module.exports.getProducts = (intent, name, author, messagetime) => {
    return queryProducts.all({
        intent: intent || null,
        name: name || null,
        author: author || null,
        messagetime: messagetime || null
    });
};

// console.log(module.exports.getProducts().slice(0, 20))

// console.log(exports.getProducts('SELL', 'IPHONE', 'Jubel Shaikh | JK Electronics').length);

module.exports.getServerConfig = () => {
    return {
        newMessageInterval: 60 * 1000
    }
}

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
    if (messageInDb !== undefined) {
        console.log('here in ifMessageExist')
        return true
    } else {
        console.log('here in else')
        return false
    }
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

function setConfig(key = 0, value = 0) {
    const query = db.prepare(`INSERT OR REPLACE INTO CONFIG (key, value) VALUES (?, ?)`);
    query.run(key, value);
}

function getConfig(key = 0) {
    const query = db.prepare(`SELECT value FROM CONFIG WHERE key = ?`);
    const result = query.get(key);
    return result ? result.value : null;
}

function getAllConfigPairs() {
    const query = db.prepare(`SELECT key, value FROM CONFIG`);
    const result = query.all();
    return result;
}

module.exports.config = { get: getConfig, set: setConfig, getAll: getAllConfigPairs }
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