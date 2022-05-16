import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: '100000000000000000000000',
      },
    },
    rinkeby: {
      url: process.env['RINKEBY_RPC_URL'] || '',
      accounts: process.env['RINKEBY_DEPLOYER_KEY'] ? [process.env['RINKEBY_DEPLOYER_KEY']] : undefined,
    },
    ropsten: {
      url: process.env['ROPSTEN_RPC_URL'] || '',
      accounts: process.env['ROPSTEN_DEPLOYER_KEY'] ? [process.env['ROPSTEN_DEPLOYER_KEY']] : undefined,
    },
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env['RINKEBY_API_KEY'] || '',
      ropsten: process.env['ROPSTEN_API_KEY'] || '',
    },
  },
};

export default config;
