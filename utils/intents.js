const _ = require('lodash')
const { forEach } = require('p-iteration')
const extractIntent = require('./extractIntent')
const { validateIntent } = require('./intent-validation')
const { registerMessageInDB, ifMessageExist } = require('../db/dbHandler')

function getJSONforIntent(resp) {
    // Try returning the parsed response as it is
    try {
        return JSON.parse(resp)
    } catch (err) { }

    let tries = 0;
    let limit = 10;
    let intent;

    // Panic backtracking
    if (resp.startsWith('[')) {
        while (resp.length > 10) {
            try {
                intent = JSON.parse(resp)
                return { products: intent }
            } catch (err) {
                tries++;
                if (tries >= limit) return

                resp = resp.slice(0, resp.lastIndexOf('}') + 1)
                resp = resp + ']'
            }
        }
    } else {
        let firstFlag = true
        while (resp.length > 10) {
            try {
                intent = JSON.parse(resp)
                return { products: intent[Object.keys(intent)[0]] }
            } catch (err) {
                tries++;
                if (tries >= limit) return
                const indexBound = firstFlag ? resp.lastIndexOf('}') + 1 : resp.slice(0, lastIndexOf('}')).lastIndexOf('}')
                firstFlag = false

                resp = resp.slice(0, indexBound)
                resp = resp + ']}'
            }
        }
    }

    return
}

async function getIntents(messages) {
    const RETRY_LIMIT = 1;
    const intents = []
    const messagesProcessed = []
    const totalMessages = messages.length;
    let processedMessages = 0;
    let progressBarIncrement = () => {
        processedMessages++;
        console.log('Intent generation progress: ' + processedMessages + '/' + totalMessages)
    }

    const isServer = process.env.deployment && process.env.deployment === 'server' ? true : false;


    await forEach(messages, async (message) => {
        if (message.predictedIntent) {
            message.chatMessage += '\nPredicted Intent: ' + message.predictedIntent
        }
        // Register the message in DB so same message don't get available.
        messagesProcessed.push(message.id)
        if (ifMessageExist(message.id, message.chatMessage)) {
            progressBarIncrement();
            return;
        }
        if (message.chatMessage.length < 10) {
            progressBarIncrement();
            return;
        }
        let tried = 0;
        while (tried < RETRY_LIMIT) {
            // INTENT GENERATION
            let intent;
            const resp = await extractIntent(message.chatMessage)
            if (resp.includes('SERVER_ERROR')) {
                if (resp.includes('429')) {
                    console.log('AI requests/min limit reached (Consider upgrading your account to avoid this error in future)')
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                continue;
            }

            if (resp.includes('CODE400')) {
                progressBarIncrement()
                return
            }

            try {
                const startIndex = resp.indexOf('{')
                const endIndex = resp.lastIndexOf('}')
                intent = getJSONforIntent(resp.substring(startIndex, endIndex + 1))
                if (validateIntent.validate(intent).error) {
                    throw new Error('Invalid Intent' + validateIntent.validate(intent).error)
                }
            } catch (error) {
                tried++;
                console.log('Error in getting intent', error.message)
                if (tried === RETRY_LIMIT - 1) {
                    if (!isServer) {
                        progressBar.interrupt(`Ignoring \"${message.chatMessage.substring(0, 20).replace('\n', ' ')}\" ` + error.message)
                    } else {
                        console.log(`Ignoring \"${message.chatMessage.substring(0, 20).replace('\n', ' ')}\" ` + error.message)
                    }
                    progressBarIncrement()
                    break;
                }
                progressBarIncrement()
                continue;
            }
            const intentObj = {
                ..._(message).pick(['chatId', 'id', 'chatName', 'chatMessage', 'chatType', 'chatMessageAuthor', 'chatMessageTime']).value(), ...intent
            }

            if (intentObj.chatMessage.includes('\nPredicted Intent:')) {
                intentObj.chatMessage = intentObj.chatMessage.substring(0, intentObj.chatMessage.indexOf('\nPredicted Intent:'))
            }

            // intent = intent.map(x => Object.fromEntries(Object.entries(x).map(
            //     ([key, value]) => [key, typeof value == 'string' ? value.toLowerCase() : value])));
            intents.push(intentObj)
            progressBarIncrement()
            break;
        }
    })

    // // Cleaning Product Types
    // const prodTypes = []
    // if (intents.length > 1) {
    //     intents.forEach((intent) => {
    //         intent.products.forEach((product) => {
    //             if (prodTypes.includes(product.type)) return
    //             else prodTypes.push(product.type.toLowerCase())
    //         })
    //     })

    //     const prodTypesMapping = await getGeneralPrdTypeMapping(JSON.stringify(prodTypes));

    //     intents.forEach((intent) => {
    //         intent.products.forEach((product) => {
    //             if (Object.keys(prodTypesMapping).includes(product.type.toLowerCase())) {
    //                 product.type = prodTypesMapping[product.type.toLowerCase()].toLowerCase()
    //             }
    //         })
    //     })
    // }
    // // End Cleaning

    // // Register the messages in DB
    messagesProcessed.forEach((message) => {
        try {
            registerMessageInDB(message)
        } catch (err) {
            console.log('Error in registering message in DB', err)
        }
    })
    return intents
}

// messages = [
//     {
//         chatId: '923246700564@c.us',
//         chatName: '+92 324 6700564',
//         chatType: 'Individual',
//         chatMessage: 'Want to sell \n' +
//             '~/ Ready Stock Dubai \n' +
//             '\n' +
//             ' ▶️ *IPHONE 24K GOLD PLATING*\n' +
//             '\n' +
//             '🔵*D Link DWR - M964G* - 4 units (WiFi Router) \n' +
//             '\n' +
//             '🎶*Speakers & Headphone*🎵\n' +
//             '\n' +
//             '▶ ️JBL Tune110 Mix \n' +
//             '▶ ️Marshall Emberton 📻🔈\n' +
//             '*▶ ️Marshall Emberton ii * 📻🔈\n' +
//             '▶ ️Marshall WILLEN 📻🔈\n' +
//             '▶ ️Marshall Killburn ii 📻🔈\n' +
//             '▶     Marshall Monitor ii ANC 🎧\n' +
//             '▶ ️Marshall Mid ANC 🎧\n' +
//             '▶ ️~Marshall Major 4 Black~ \n' +
//             '*▶ ️Marshall Minor III* \n' +
//             '\n' +
//             '📻 🔊Woburn 2 - Black, Brown \n' +
//             '📻 🔊Stanmore 2  - Black, Brown \n' +
//             '📻 🔊Acton 2  - Brown, Black\n' +
//             '📻 🔊Marshall Tufon  - Black \n' +
//             '\n' +
//             '📻 🔊Woburn 3 - Black, Cream\n' +
//             '📻 🔊Stanmore 3 - Black, Brown \n' +
//             '📻 🔊Acton 3 - Black, Brown \n' +
//             '\n' +
//             ' *Samsung *\n' +
//             '\n' +
//             '▶️ TA800 25w Adaptor 3 pin UK \n' +
//             '▶️ TA800 25w Adaptor 2 pin EU\n' +
//             '▶️ TA800 25W Adaptor with Cable 2 pin EU \n' +
//             '▶️ TA845 45w Adaptor with Cable 2 pin EU \n' +
//             '▶️ TA845 45W Adaptor with Cable 3 pin UK \n' +
//             '▶️ TA200 15w Adaptor with Cable 3 pin UK \n' +
//             '▶️ Cable C - C (5A, 1 meter) \n' +
//             '▶️ Cable C - C ( 1 Meter) \n' +
//             '▶️ IC100 - Samsung Type - C Earphones \n' +
//             '\n' +
//             '*Apple*\n' +
//             '\n' +
//             '▶️ *~USB-C to Digital AV MUF82*~\n' +
//             '▶️ iPhone 11 64gb *iCloud Lock*\n' +
//             '▶️ *iPhone Batteries ALL MODELS*\n' +
//             '▶ Apple Watch Charger USB \n' +
//             '▶ Apple Watch Charger USB-C \n' +
//             '▶ ~*Apple Battery Pack* (Wireless Magnatic) (MJWY3) \n' +
//             '\n' +
//             '▶️ Apple Magic Mouse - Ready \n' +
//             'Silver (MLA02) 2nd Gen🖱️\n' +
//             'Black (MRME2) 2nd Gen \n' +
//             '*Silver (MK2E3) 3rd Gen *🖱️\n' +
//             '*Black (MMMQ3) 3rd Gen* \n' +
//             '\n' +
//             '▶️ *Apple 61w USB-C Adaptor 3 pin*\n' +
//             '▶️ *Apple 96w USB-C Adaptor 3 pin*\n' +
//             '▶️ Apple 20w 2 pin *USA * (MHJ83) \n' +
//             '▶️ Apple 20w 2 pin Plug *EU* (MHJE3) \n' +
//             '▶️ Apple 20w 3 pin Plug *TRA* (MHJF3)\n' +
//             '▶️ Apple 5w 3 pin (MD812)\n' +
//             '▶️ Apple MegSafe Charger *Magnatic* (MHXH3) \n' +
//             '▶️ MNHF2 ( EarPods With 3.5mm Jack) \n' +
//             '▶️ MMTN2 ( EarPods With Lightning Connector) \n' +
//             '\n' +
//             '▶️ MMX62 ( Lightning to 3.5mm Jack) \n' +
//             '\n' +
//             '▶️ MR2C2 ( Lightning to 3.5mm Audo Jack cable(1.2m) \n' +
//             '\n' +
//             '▶️ MXLY2 / MD818( 1 meter USB with Lightning Cable) \n' +
//             '\n' +
//             '▶️ MD819 ( 2 meter USB to Lightning Cable) \n' +
//             '\n' +
//             '▶️ MUF72 ( 1 meter Type C to Type C) \n' +
//             '▶️ MLL82 ( 2 meter Type C to Type C) \n' +
//             '▶️ MKQ42 ( 2 meter Type C to Lightning Cable ) big box \n' +
//             '▶️ MX0K2ZE/A  / MMA03 ( 1 meter Type C to Lightning)\n' +
//             '____________________________________\n' +
//             '\n' +
//             '*All Physical Stock Dubai*',
//         chatMessageAuthor: '+92 324 6700564',
//         chatMessageTime: 1681486599,
//         id: 'false_923246700564@c.us_AA35D3459FF0722D1246FE927481ECD9',
//         fromMe: false,
//         predictedIntent: 'Sell'
//     },
// ]

// getIntents(messages).then((intents) => {
//     // console.log(JSON.stringify(intents, null, 2))
// }).catch((err) => {
//     console.log(err)
// })

module.exports.getIntents = getIntents
