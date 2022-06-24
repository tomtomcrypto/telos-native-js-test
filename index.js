const fs = require('fs');
var Mocha = require("mocha");
var chai = require("chai");
var path = require("path");
var originalRequire = require("original-require");
const  EOSJS  = require('./utils/EOSJS_Instance');


const getTestFiles = async function (testDirectory) {
    return new Promise((resolve, reject) => {
        fs.readdir(testDirectory, function (error, files) {
            if (error) {
                reject(new Error(error));

                return;
            }

            files = files.filter(function (file) {
                return  file.match(/.*\.(js)$/) != null && file.match(/.*index.js$/) == null;
            });

            files = files.map(function (file) {
                return testDirectory + "/" + file;
            });

            resolve(files);
        });
    });
}
const getConfig = async function (testDirectory) {
    return new Promise((resolve, reject) => {
        let config = fs.readFileSync(testDirectory + "/config.json", 'utf8');
        if(config){
            resolve(JSON.parse(config));
        } else {
            reject("No config file found, please make sure " + testDirectory + "/config.json exists");
        }
    });
}
const createMocha = (config, files) => {
    var mocha = new Mocha(config);

    files.forEach(file => {
        mocha.addFile(file);
    });

    return mocha;
}

const runMocha = async (mocha) => {
    return new Promise((resolve, reject) => {
        mocha.run(failures => {
            process.exitCode = failures ? -1 : 0;
            if (failures) {
                reject()
            } else {
                resolve()
            }
        });
    })
}

const setJSTestGlobals = () => {
    global.assert = chai.assert;
    global.expect = chai.expect;
}
const test = async (dir) => {
    dir = path.resolve(__dirname).split('/node_modules')[0] + "/" + dir;
    const config = await getConfig(dir);
    // INIT EOSJS FROM CONFIG
    try {
        EOSJS.init(config.endpoint, config.privateKeys)
    } catch (e) {
        console.log("/!\\ EOSJS could not initialize:", e.message)
    }

    // GET TEST FILES
    var files = await getTestFiles(dir);
    console.log("Loading tests:", files)

    // ADD FILE TO MOCHA
    var mochaConfig = { 'useColors': true, 'timeout': 20000 };
    let mocha = createMocha(mochaConfig, files);
    files.forEach(function (file) {
        delete originalRequire.cache[file];
        mocha.addFile(file);
    });

    setJSTestGlobals();
    // RUN
    await runMocha(mocha);
};

module.exports = {
    test, EOSJS
};