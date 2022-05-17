import hre, { ethers } from 'hardhat';
import _ from 'lodash';
const Confirm = require('prompt-confirm');

async function main() {
  let clvAddress = process.env['CLV_TOKEN_ADDRESS'] || '';
  if (_.isEmpty(clvAddress)) {
    const confirm = await new Confirm('Deploy clv token?').run();
    if (!confirm) {
      return;
    }

    const CLV = await ethers.getContractFactory('CloverToken');
    const clv = await CLV.deploy();
    console.log(`clv token deployed to ${clv.address}`);
    clvAddress = clv.address;
  }

  const confirm = await new Confirm(`Deploy clv bridge with token address: "${clvAddress}"?`).run();
  if (!confirm) {
    return;
  }
  const Bridge = await ethers.getContractFactory('CloverBridge');
  const bridge = await Bridge.deploy(clvAddress);
  console.log(`bridge deployed to ${bridge.address}`);

  // console.log('minting clv');
  // await clv.mint(bridge.address, ethers.utils.parseEther('1000000'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
