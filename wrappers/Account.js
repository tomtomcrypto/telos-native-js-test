const { EOSRpc } = require('../utils/EOSJS_Instance').getInstance();

class Account {
    constructor(name) {
        this.name = name;
        this.basePermissions = {
            owner: {
                actor: name,
                permission: 'owner'
            },
            active: {
                actor: name,
                permission: 'active'
            }
        };
    }

    async getAccountData(accountName) {
        let accountData = await EOSRpc.get_account(accountName);
        let parsedData = JSON.parse(JSON.stringify(accountData));

        return {
            'account_name': parsedData['account_name'],
            'isPrivileged': parsedData['privileged'],
            'net_limit': {
                'used': parsedData['net_limit'].used,
                'available': parsedData['net_limit'].available,
                'max': parsedData['net_limit'].max
            },
            'cpu_limit': {
                'used': parsedData['cpu_limit'].used,
                'available': parsedData['cpu_limit'].available,
                'max': parsedData['cpu_limit'].max
            },
            'ram_usage': parsedData['ram_usage'],
            'permissions': parsedData['permissions'],
            'total_resources': parsedData['total_resources']
        };
    }

    async buyRam() {

    }
}

module.exports = Account;