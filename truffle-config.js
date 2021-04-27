const HDWalletProvider = require('@truffle/hdwallet-provider');
// notes: BSCSCANAPIKEY and BSCPRIVATEKEY are reused for both bsc and eth
const { mnemonic, BSCSCANAPIKEY, BSCPRIVATEKEY } = require('./env');

module.exports = {
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    bscscan: BSCSCANAPIKEY,
    etherscan: BSCSCANAPIKEY
  },
  networks: {
    testnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      dryrun: false,
      timeoutBlocks: 200,
      confirmations: 5,
      production: true,
    },
    smartchain: {
      provider: () => new HDWalletProvider({
        privateKeys: [
          BSCPRIVATEKEY,
        ],
        providerOrUrl: "https://bsc-dataseed.binance.org/"
      }),
      chain_id: 56,
      network_id: 56,
      gas: 8000000,
      confirmations: 1,
      gasPrice: 20000000000,
      timeoutBlocks: 50,
      skipDryRun: true,
      networkCheckTimeout: 10000000
    },
    mainnet: {
      provider: () => new HDWalletProvider({
        privateKeys: [
          BSCPRIVATEKEY,
        ],
        providerOrUrl: "https://mainnet.infura.io/v3/428c9baabdf54b7597db80541f94311e"
      }),
      network_id:    1,
      gas:           8000000,
      confirmations: 1,
      gasPrice: 80000000000,
      timeoutBlocks: 50,
      skipDryRun:    true,
      networkCheckTimeout: 10000000
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
