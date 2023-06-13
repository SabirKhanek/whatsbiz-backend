const { getOpenAI } = require('./openai')
const { getIntentAnalysisCmd: getCommand } = require('./prompts')

async function extractIntent(request) {
    request = request.replace(/\n\s+/g, '\n');
    request = getCommand(request)
    request = { "role": "user", "content": request }
    try {
        const resp = await getOpenAI().createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.1,
            messages: [{ 'role': 'system', 'content': ("Implement a message processing system that can detect whether a user is listing products for buy or sell in their messages. The system should only process the given text and not request any additional information. If the message contains products listed for buy or sell, the system should output the list of products along with the relevant action (Buy/Sell). If there are no products detected, output 'CODE400'.") }, request]
        })

        if (resp.data.choices[0].message.content) {
            txt = resp.data.choices[0].message.content
            return txt
        } else {
            return resp.message
        }
    }
    catch (err) {
        return "SERVER_ERROR" + err.message
    }
}

// getOpenAI().createChatCompletion({
//     model: "gpt-3.5-turbo",
//     temperature: 0.1,
//     messages: [{ role: 'user', content: 'Hi' }]
// }).then(resp => {
//     console.log(resp.data.choices[0].message.content)
// }).catch(err => {
//     console.log(err)
// })

// extractIntent(`Selling Ready Stock*	
// Brand New / Non-active
// Price AED	

// 🇯🇵 14 Pro Max 1TB 
// Black/Gold 
// Purple 

// 🇯🇵 14 Pro Max 128GB 
// Black

// 🇯🇵 14 Pro 1TB Black 

// 🇯🇵 iPhone 14 Plus 512GB Blue 	

// 🇯🇵 iPhone 14 Plus 256GB 
// Midnight 	/ starlight /purple / blue 

// 🇯🇵 iPhone 14 Plus 128GB 
// Midnight 	/ starlight / purple 

// 🇯🇵 iPhone 13 Pro Max 1TB 
// Green / Gold / blue 

// 🇯🇵 iPhone 13 Pro Max 256GB 
// Green 	/ Blue / silver 

// 🇯🇵 iPhone 13 Pro Max 128GB 
// Green 	/ Graphite / Blue 

// 🇯🇵 iPhone 13 Pro 512GB 
// Green 	/ Silver 

// 🇯🇵 iPhone 13 Pro 256GB 
//  Green 	/ Blue 

// 🇯🇵 iPhone 13 Pro 128GB 
// Green 	/ Blue / Silver 

// 🇯🇵 13 128GB 
// Midnight/ starlight 


// 🇦🇪 13 256GB Midnight    

// 🇭🇰 14 Pro Max 128GB Black 	

// 🇮🇳 14 128GB Starlight/Blue 
// 🇮🇳 13 256GB Midnight     
// 🇮🇳 12 256GB Black 	

// 🇮🇳 SE 2 256GB 
// RED 
// Black/White 

// 🇺🇸 11 Pro Max 256GB Green 	
// 🇺🇸 11 Pro Max 64GB Green/Silver 
// 🇺🇸 11 Pro 256GB Gold 	
// 🇺🇸 11 64GB Black/red 
// 🇺🇸 Xr 64GB RED 	

// 🇩🇪 12 Pro Max 512GB Silver 	

// 🇹🇼 12 Mini 256GB
// Red 
// Black/Green/Purple/White 

// 🇹🇼 12 Mini 128GB
// Black/Purple/White 

// 🇹🇼 12 Mini 64GB
// Black/Green/Purple/White 

// 🇵🇾 SE 2 256GB Black 	

// 🇧🇭 Xs Max 64GB Silver/Gray 

// - - - - - - - - - - - - - - - -
// Accessories

// 🇺🇸 TV 4K 2nd Gen 64GB A2169 	
// 🇺🇸  Series 7 41MM Silver Steel 	

// 🇬🇧 AirTag 4 pack MC 


// 	*+971502305191 *
// • PM to place your order:	
// THT | Three Heros Trading L.L.C`).then((res) => {
//     console.log(res)
//     console.log(JSON.parse(res))
// }).catch((err) => console.log(err.message))


module.exports = extractIntent;