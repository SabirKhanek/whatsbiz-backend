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

module.exports.get_classification = get_classification