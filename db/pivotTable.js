const { spawn } = require('child-process-promise');


async function add_pivot(filename) {
    console.log('Pivot table creation recieved: ' + filename)

    const processPath = './db'

    const spawned = spawn('python', ['pivot.py', filename], { cwd: processPath, shell: true });

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
        console.log(err.message)
    }

    // Process the output
    const response = output.trim()
    console.log(response)


    return response;
}

module.exports.add_pivot = add_pivot;