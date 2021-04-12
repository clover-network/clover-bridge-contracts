# Bridge Contracts Deployment Guide
This is s brief deployment steps for clover bridge contracts. It uses truffle as the tool to build and deploy bridge contracts.

## Setup
Install truffle using below command:
```bash
npm install -g truffle
```

Run `npm install` in the source code directory.

## Configuration
### Prepare Accounts
Contracts require below accounts
- Deployer account - A hot account which used for contract deployment, it should have enough BNB to pay the transaction fees.
- Admin account: Super account to manage token and bridge contracts. *A Hardware wallet is recommended.*
- Pauser account: account who can pause token transfering. *A Hardware wallet is recommended.*
- Minter account: account who can mint the CLV token on BSC. *A Hardware wallet is recommended.*
- Bridge Account: account used to mint cross chain transactions. It will be used by the bridge service.
- Bsc scan api key: used to verify contract source code.

### env.js
Env js should be configured like below:
```js
module.exports = {
  mnemonic: '24 seed words!',
  BSCSCANAPIKEY: 'bsc scan api key',
  accounts: {
    minter: '0x0000000000000000000000000000000000000000',
    pauser: '0x0000000000000000000000000000000000000000',
    admin: '0x0000000000000000000000000000000000000000',
    bridge: '0x0000000000000000000000000000000000000000',
  }
}
```

Make sure the accounts are configured correctly.

### network configuration
Add the network configuration to the truffle-config.js.

## Deploy
run
```bash
truffle deploy --network "yournetwork"
```
to deploy the contracts.

## Verify contracts

```bash
truffle run verify --network "yournetwork" CloverToken CloverBridge
```

