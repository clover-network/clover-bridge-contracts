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
    clv: {
      url: process.env.CLV_API_URL || 'https://api-para.clover.finance',
      accounts: process.env.CLV_PRIVATE_KEY ? [process.env.CLV_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env['RINKEBY_API_KEY'] || '',
      ropsten: process.env['ROPSTEN_API_KEY'] || '',
      clv: process.env.CLV_SCAN_API_KEY || '',
    } as any,
    customChains: [
      {
        network: 'clv',
        chainId: 1024,
        urls: {
          apiURL: 'https://api.clvscan.com/api',
          browserURL: 'https://clvscan.com',
        },
      },
    ],
  },
  gasReporter: {
    gasPrice: 10,
    ethPrice: 1000,
  } as unknown as any, // to support ethPrice config
};

export default config;
