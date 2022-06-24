const { Api, JsonRpc, RpcError, Serialize } = require('eosjs');
const { TextEncoder, TextDecoder } = require('util');

const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const fetch = require('node-fetch').default;

const Validator = require('./Validator');

let EOSJS_Instance = (() => {
    let instance;

    function createInstance(endpoint, privateKeys) {

        let signatureProvider = new JsSignatureProvider(privateKeys);

        let rpc = new JsonRpc(endpoint, { fetch });
        let EOSApi = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

        return {
            EOSApi: EOSApi,
            EOSRpc: rpc,
            RpcError: RpcError,
            Serialize: Serialize,
            JsSignatureProvider: JsSignatureProvider
        };
    }

    function validateParameter(endpoint, privateKeys) {

        let validator = new Validator();
        validator.isValidString(endpoint);

        if (!Array.isArray(privateKeys)) {
            throw new Error('Expected collection of private keys. Unable to instantiate eosjs');
        }

        if (privateKeys.length === 0) {
            throw new Error('Empty array of private keys. Unable to instantiate eosjs');
        }

        privateKeys.forEach((key) => {
            validator.isValidString(key);
        });
    }

    return {
        init: (endpoint, privateKeys) => {
            console.log(privateKeys)
            if (!instance) {
                validateParameter(endpoint, privateKeys);
                instance = createInstance(endpoint, privateKeys);
            }

            return instance;
        },

        getInstance: () => {
            if (!instance) {
                throw new Error('Unable to get an instance. EOSJS need to be initialized first');
            }

            return {
                EOSApi: instance.EOSApi,
                EOSRpc: instance.EOSRpc,
                RpcError: instance.RpcError,
                Serialize: instance.Serialize
            };
        }
    };
})();

module.exports = EOSJS_Instance;