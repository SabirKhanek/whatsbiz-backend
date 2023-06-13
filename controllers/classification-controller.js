const { spawn } = require('child-process-promise');
const fs = require('fs')
const iconv = require('iconv-lite');
const { registerClassifiedMessage } = require('../db/dbHandler')

async function get_classification(messages) {
    console.log('Classification request recieved...')

    const classifierPath = './intent-classifier'
    const payloadFileName = '/payload_' + Date.now() + '.txt'
    const payloadPath = classifierPath + payloadFileName

    data = ''
    messages.forEach((message) => {
        const str = `${message}\n`.replace(/\n/g, ' ')
        let cleanStr = iconv.decode(iconv.encode(str, 'UTF-8', { 'mode': 'replace' }), 'UTF-8');
        cleanStr += '\n'
        if (cleanStr.length <= 0) cleanStr = ""
        data += cleanStr
    })
    data = data.slice(0, data.length - 2)


    await fs.promises.writeFile(payloadPath, data, { flag: 'w', encoding: 'utf8' });

    // Asynchronously spawn the child process
    let spawned;

    spawned = spawn('python', ['intent-classifier.py', 'predict', '.' + payloadFileName], { cwd: classifierPath, shell: true });

    var subprocess = spawned.childProcess;

    let output;
    // Wait for the process to exit and capture its output
    try {
        output = await new Promise((resolve, reject) => {
            let result = '';
            subprocess.stdout.on('data', (data) => {
                result += data;
            });
            subprocess.stdout.on('close', () => {
                resolve(result);
            });
            subprocess.on('error', (err) => {
                console.log(err)
                reject(err);
            });
        });

    } catch (err) {
        console.log(err)
    }

    // delete payload file
    fs.unlinkSync(payloadPath)

    // Process the output
    const response = output.trim()
    console.log(response)

    const parsedResponse = JSON.parse(response.replace(/'/g, "\""));
    console.log(`Messages length: ${messages.length} \nResponse Length: ${parsedResponse.length} `)
    const result = {};
    for (let i = 0; i < messages.length; i++) {
        result[messages[i]] = parsedResponse[i];
        registerClassifiedMessage(messages[i], parsedResponse[i])
    }
    return result;
}

// //Messages
// const messages = [
//     'Bureaucrats refer to the people who work in the administrative departments of various organizations and are responsible for implementing rules and regulations, maintaining records, and ensuring that the work is done efficiently. The term Technocrats refers to the people who hold administrative positions in organizations and have considerable technical knowledge and expertise in their respective fields. They are primarily responsible for making organizational decisions based on technical knowledge and expertise, often disregarding or downplaying other factors such as social, economic, or political considerations.',
//     'What is meant by Bereaucrtaes and Technocrats in urdu ?',
//     'What is meant by Bereaucrtaes and Technocrats in urdu ?',
//     'Why the satellite revolving around the earth does not burn, when it faces the sun  ?',
//     'Something went wrong. Try clearing the conversation by typing "%%clear"',
//     'Why satellite revolving around the Earth does not burn, when it faces the sun ?',
//     "Satellites do get affected by the sun's heat, but they don't burn up in space because there is no atmosphere to transfer the heat like it would on Earth. The vacuum of space makes it difficult for heat to be directly transferred away from the surface of the satellite, which means that it can become extremely hot on the side that's facing the sun. However, satellites are designed to withstand extreme temperatures and have special coatings that help to reflect and dissipate some of the heat. Additionally, satellite orbits are carefully planned so that they don't spend too much time in direct sunlight, which helps to prevent them from overheating.",
//     'Inundation means to flood or overflow with water, to overwhelm something or someone with a large amount of things or people, or to pour down or shower heavily.',
//     'What is meant by "mumps"',
//     'Mumps is a highly contagious viral disease, which affects mainly the salivary glands in humans. It is spread through direct contact with respiratory secretions, such as saliva, from an infected person. The most common symptoms of mumps include fever, headache, muscle aches, tiredness, loss of appetite, and swollen and painful salivary glands under the ears on one or both sides. The virus can also cause swelling of the testicles or ovaries, and in rare cases, can lead to complications such as hearing loss, meningitis, encephalitis, or inflammation of the pancreas.',
//     'What are its causes ?',
//     'Mumps is caused by a virus belonging to the Paramyxovirus family. The virus is mainly spread through direct contact with saliva, nasal secretions, or other respiratory fluids of an infected person. The virus can also be spread via contaminated surfaces or objects. The virus enters the body through the nose or mouth and travels through the bloodstream to infect the salivary glands, causing them to swell and become painful. Mumps is highly contagious, and people who have not been vaccinated are at a higher risk of getting infected.However, getting vaccinated against mumps significantly reduces the risk of getting infected with the virus.',
//     'What is the name of its vaccine & what are the precautionary measures for it & cures ?',
//     'The vaccine for mumps is called the MMR vaccine. It is a combination vaccine that protects against measles, mumps, and rubella. The vaccine is highly effective and is given in two doses, usually at the age of 12-15 months, and the second dose is given between the age of 4-6 years. \n' +
//     '\n' +
//     'There are several precautionary measures that can be taken to prevent the spread of mumps. These include avoiding close contact with infected persons, washing hands frequently, covering mouth and nose while coughing or sneezing, and disinfecting surfaces that may be contaminated with the virus. \n' +
//     '\n' +
//     'If a person is infected with mumps, they should stay isolated from others for a period of 5 to 9 days after the onset of symptoms to prevent the spread of the virus. Treatment is focused on relieving the symptoms of the infection, such as fever and pain, and ensuring that the patient gets adequate rest and fluids. Pain relievers and anti-inflammatory drugs can offer relief from symptoms, but resuming normal activities should be postponed until symptoms have resolved completely to avoid complications.',
//     'Macguys provides a wide range apple repairs and services alongside Windows Laptop/PC repairs. We also provide 6 months warranty on all repairs.  \n' +
//     '\n' +
//     'For more info Visit Or Call Us:\n' +
//     '\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '\n' +
//     '📱647-786-4274 I 647-526-1189\n' +
//     '\n' +
//     '_____________________\n' +
//     '\n' +
//     '🔥iPhone 11 in Stock\n' +
//     '\n' +
//     'Quantity Available \n' +
//     'Fully Tested and Functional Guaranteed\n' +
//     '\n' +
//     'Mixed Grades\n' +
//     '\n' +
//     'Available at Macguys\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '📱647-786-4274 I 647-526-1189\n' +
//     '\n' +
//     '_____________________\n' +
//     '\n' +
//     '🔥iPhone 11 Pro in Stock\n' +
//     '\n' +
//     'Quantity Available \n' +
//     'Fully Tested and Functional Guaranteed\n' +
//     '\n' +
//     'Mixed Grades\n' +
//     '\n' +
//     'Available Only at Macguys\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '📱647-786-4274 I 647-526-1189\n' +
//     '\n' +
//     '\n' +
//     '🔥iPhone 11 Pro Max in Stock\n' +
//     '\n' +
//     'Quantity Available \n' +
//     'Fully Tested and Functional Guaranteed\n' +
//     '\n' +
//     'Mixed Grades\n' +
//     '\n' +
//     'Available Only at Macguys\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '📱647-786-4274 I 647-526-1189\n' +
//     'Macguys provides Data Recovery services using the latest technology.  \n' +
//     '\n' +
//     'For more info Visit Or Call Us:\n' +
//     '\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '\n' +
//     '📱647-786-4274 I 647-526-1189\n' +
//     '\n' +
//     '\n' +
//     'iPhone 11/Pro/11 Pro Max in Stock\n' +
//     '\n' +
//     'Grade A, B, & C \n' +
//     'Fully Tested and Functional\n' +
//     '\n' +
//     '🔥iPhone 11\n' +
//     '🔥iPhone 11 Pro\n' +
//     '🔥iPhone 11 Pro Max \n' +
//     '\n' +
//     'Please PM for the price and quantity.\n' +
//     '\n' +
//     'Available at Macguys\n' +
//     '📍1022 St Clair Ave West, Toronto\n' +
//     '📱647-786-4274 I 647-526-1189',
//     'Brand new sealed \n' +
//     '\n' +
//     'MacBook Pro , 16 inch (2023), with m2 max chip, \n' +
//     '\n' +
//     '         *12 core cpu, 38 core gpu\n' +
//     '         *32gb ram, 1TB SSD\n' +
//     '         *Space gray\n' +
//     '\n' +
//     'AT MASTEL WIRELESS \n' +
//     'CELL: 647 835 0426',
//     'Looking iPhone 12 mini or 13mini. Pm',
//     '*⚡️💥⚡️iPhone SE 2020 64GB & 128GB with Good battery life back in stock @ OEM tech 💥⚡️PM for best price 💥⚡️*',
//     'WTS USA 🇺🇸\n' +
//     '\n' +
//     '\n' +
//     '*NON ACTIVE/ACTIVE STOCK*\n' +
//     '\n' +
//     'LOCKED 🔒 \n' +
//     '\n' +
//     'IPHONE 14 PRO MAX 1TB NON ACTIVE \n' +
//     'PURPLE 5@3450\n' +
//     'BLACK 1@ 3450\n' +
//     '\n' +
//     'IPHONE 14 PRO MAX 512 GB NON ACTIVE \n' +
//     'BLACK 2@ 3300\n' +
//     '\n' +
//     'IPHONE 14 PRO MAX 256 GB NON ACTIVE \n' +
//     'SLIVER 1@2950\n' +
//     '\n' +
//     'IPHONE 14 PRO 256 GB NON ACTIVE \n' +
//     'BLACK 2 @ 2700\n' +
//     'SILVER 1 @ 2700\n' +
//     '\n' +
//     'IPHONE 14 PRO 256 GB ACTIVE \n' +
//     'PURPLE 1 @ 2750\n' +
//     '\n' +
//     '\n' +
//     'IPHONE 14 PRO 128 GB ACTIVE \n' +
//     'BLACK 3 @ 2450\n' +
//     'GOLD 1 @ 2450\n' +
//     '\n' +
//     'IPHONE 13 PRO MAX 512 GB NON ACTIVE \n' +
//     'SEIRA BLUE 1 @2650\n' +
//     '\n' +
//     'Wajahat naeem \n' +
//     '0523442509',
//     'https://www.amazon.com/SAMSUNG-Factory-Unlocked-Smartphone-Lavender/dp/B0BLP2B5DZ\n' +
//     '*Nets @$1379*\n' +
//     '\n' +
//     '*Samsung S23 Ultra 512GB*\n' +
//     '\n' +
//     'Samsung S23 Ultra 512GB \n' +
//     'SM-S918U1\n' +
//     '*Black*\n' +
//     'Unlocked\n' +
//     'New, Retail Package, Full Warranty\n' +
//     '*1000 units*\n' +
//     '\n' +
//     '*$1185.00 per unit. Take All*\n' +
//     '*Fob USA*\n' +
//     '\n' +
//     ' *Since 1991, NYC, USA*\n' +
//     '*Corporate Office*\n' +
//     '*Sales@compuaddons.com*\n' +
//     '*Www.compuaddons.com* \n' +
//     '*Nick +1 917 2167598/WhatsApp* \n' +
//     '*Al      +1 516 3432608/WhatsApp* \n' +
//     '\n' +
//     '*Since 2012, Mumbai, India* \n' +
//     '*Marketing Branch Only*\n' +
//     '*sales@globalplayersintl.com*\n' +
//     '*Www.globalplayersintl.com* \n' +
//     '*+91 9819246785/WhatsApp*',
//     '💢 Sale 💢\nM2 256gb pulled single cut\nPulled',
//     'Want to buy \n' +
//     'Tiny barebone \n' +
//     'Dell 4th 6th 7th 8th 9th 10th\n' +
//     'Hp 4th 8th 9th \n' +
//     'Lenovo 6th 7th 4th 8th 9th\n' +
//     'Amd tiny',
//     '*WTS*\n' +
//     '🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸🇺🇸\n' +
//     '\n' +
//     'IPAD AIR 5 64 WIFI\n' +
//     'Grey\n' +
//     'Silver\n' +
//     'Purple\n' +
//     'Blue\n' +
//     'Pink\n' +
//     'Ipad Air 5 256 gb wifi\n' +
//     'Starlight \n' +
//     'Pink',
//     '*🔥🔥WTS🔥🔥*\n' +
//     '\n' +
//     '*Mi Tv Stick EU*\n' +
//     '\n' +
//     '*Mi Tv Stick 4K EU*\n' +
//     '\n' +
//     '*Ready Stock With Good Price*',
//     '*WTS*\n' +
//     '\n' +
//     '*NONACTIVE  🇯🇵🇭🇰  *\n' +
//     '\n' +
//     '\n' +
//     '*14 PRO MAX 256*\n' +
//     '  Purple🟣🇯🇵 🇭🇰\n' +
//     'BLACK⚫️🇯🇵\n' +
//     '\n' +
//     '*READY STOCK *',
//     'Want to sale \nDell 130w normal \nQuantity available',
//     '💻*WTB HP 440 G5/G6 I5 8GB 256GB SSD X 150 PCS*💻PM QTY/PRICE📲',
//     'WTS:\n' +
//     '\n' +
//     'iPhone 8 64gb A1905\n' +
//     'Condition: Tested Unlocked\n' +
//     'Grade: A/B/C\n' +
//     'Colors: Mix\n' +
//     'Quantity: 500\n' +
//     '\n' +
//     'PM for details',
//     'Want to buy \n' +
//     'Tiny barebone \n' +
//     'Dell 4th 6th 7th 8th 9th 10th\n' +
//     'Hp 4th 8th 9th \n' +
//     'Lenovo 6th 7th 4th 8th 9th\n' +
//     'Amd tiny',
//     'Tameez yeh wali pehly dikhani thi'
// ]

// get_classification(messages).then((result) => {
//     console.log('done')
// })

module.exports.get_classification = get_classification