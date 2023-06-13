const { spawn } = require('child-process-promise');

module.exports = function installPipPackages() {
    console.log('Installing pip packages...')
    const pipSpawn = spawn('pip', ['install', 'numpy', 'pandas', 'joblib', 'scipy', 'scikit-learn', 'nltk', 'openpyxl']);
    const pipSubprocess = pipSpawn.childProcess;
    return new Promise((resolve, reject) => {
        let result = '';
        pipSubprocess.stdout.on('data', (data) => {
            result += data;
            console.log(data.toString());
        });
        pipSubprocess.stdout.on('close', () => {
            resolve(result);
        });
        pipSubprocess.on('error', (err) => {
            reject(err);
        });
    })
}