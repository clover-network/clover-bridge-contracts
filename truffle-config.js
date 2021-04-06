const HDWalletProvider = require('@truffle/hdwallet-provider');
const { mnemonic, BSCSCANAPIKEY} = require('./env');

module.exports = {
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    bscscan: BSCSCANAPIKEY
  },
  networks: {
    testnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      dryrun: false,
      timeoutBlocks: 200,
      confirmations: 5,
      production: true,
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin (default: truffle's version)
      evmVersion: "byzantium",
    }
  },

  db: {
    enabled: false
  }
};
