const { EOSRpc, EOSApi, Serialize } = require('../../test/utils/EOSJS_Instance').getInstance();
const fs = require('fs');
const path = require(`path`);
const Account = require('./Account');

class Contract extends Account {
    constructor(...args) {
        super(...args);
        this.user = args.name;
    }
    async connect(user){
        this.user = user;
    }
    async clear(){
        const result = await EOSApi.transact(
            {
                actions: [
                    {
                        account: "eosio",
                        name: 'setcode',
                        authorization: [
                            {
                                actor: this.name,
                                permission: 'active',
                            },
                        ],
                        data: {
                            account: this.name,
                            vmtype: 0,
                            vmversion: 0,
                            code: '',
                        },
                    },
                    {
                        account: "eosio",
                        name: 'setabi',
                        authorization: [
                            {
                                actor: this.name,
                                permission: 'active',
                            },
                        ],
                        data: {
                            account: this.name,
                            abi: '',
                        },
                    },
                ],
            },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            }
        )
    }
    async getTableRows(table, limit) {
        try {
            let rows = await EOSRpc.get_table_rows({
                json: true,
                code: this.name,
                scope: this.name,
                table: table,
                limit: limit,
                reverse: false,
                show_payer: false
            });
            return rows;
        } catch (e) { console.log(e)}
        return false;
    }

    getDeployableFilesFromDir(dir) {
        const dirCont = fs.readdirSync(dir)
        const wasmFileName = dirCont.find(filePath => filePath.match(/.*\.(wasm)$/gi))
        const abiFileName = dirCont.find(filePath => filePath.match(/.*\.(abi)$/gi))
        if (!wasmFileName) throw new Error(`Cannot find a ".wasm file" in ${dir}`)
        if (!abiFileName) throw new Error(`Cannot find an ".abi file" in ${dir}`)
        return {
            wasmPath: path.join(dir, wasmFileName),
            abiPath: path.join(dir, abiFileName),
        }
    }


    async sendAction(name, value) {
        try {
            const results = await EOSApi.transact({
                actions: [{
                    account: this.name,
                    name: name,
                    authorization: [{
                        actor: this.user,
                        permission: 'active',
                    }],
                    data: value,
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30,
            });
            return results;
        } catch (e) {
            console.log(e.message)
            return false;
        }
    }

    async deploy(contractDir) {
        contractDir = (contractDir) ? contractDir : "../build";
        const { wasmPath, abiPath } = this.getDeployableFilesFromDir(contractDir)

        // 1. Prepare SETCODE
        // read the file and make a hex string out of it
        const wasm = fs.readFileSync(wasmPath).toString(`hex`)

        // 2. Prepare SETABI
        const buffer = new Serialize.SerialBuffer({
            textEncoder: EOSApi.textEncoder,
            textDecoder: EOSApi.textDecoder,
        })
        let abi = JSON.parse(fs.readFileSync(abiPath, `utf8`))
        const abiDefinition = EOSApi.abiTypes.get(`abi_def`)
        // need to make sure abi has every field in abiDefinition.fields
        // otherwise serialize throws
        abi = abiDefinition.fields.reduce(
            (acc, { name: fieldName }) =>
                Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
            abi
        )
        abiDefinition.serialize(buffer, abi)

        // 3. Send transaction with both setcode and setabi actions
        const result = await EOSApi.transact(
            {
                actions: [
                    {
                        account: "eosio",
                        name: 'setcode',
                        authorization: [
                            {
                                actor: this.name,
                                permission: 'active',
                            },
                        ],
                        data: {
                            account: this.name,
                            vmtype: 0,
                            vmversion: 0,
                            code: wasm,
                        },
                    },
                    {
                        account: "eosio",
                        name: 'setabi',
                        authorization: [
                            {
                                actor: this.name,
                                permission: 'active',
                            },
                        ],
                        data: {
                            account: this.name,
                            abi: Buffer.from(buffer.asUint8Array()).toString(`hex`),
                        },
                    },
                ],
            },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            }
        )
    }
}

module.exports = Contract;