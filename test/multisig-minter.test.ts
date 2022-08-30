import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import chaiAsPromised, { transferPromiseness } from 'chai-as-promised';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';
import { copyFile } from 'fs';
chai.use(chaiAsPromised);

describe('multi sig minter', function () {
  it('manage bridge configs', async function () {
    const [, alice, bob, dave] = await ethers.getSigners();

    const CLV = await ethers.getContractFactory('CloverToken');
    const clv = await CLV.deploy();
    const Bridge = await ethers.getContractFactory('CloverBridge');
    const bridge = await Bridge.deploy(clv.address);
    await clv.mint(bridge.address, parseEther('1000'));

    const MultiSigMinter = await ethers.getContractFactory('MultiSigMinter');
    const mminter = await MultiSigMinter.deploy(bridge.address);
    await expect(mminter.setBridgeParams(1, 2, parseEther('0.01')))
      .to.emit(mminter, 'BridgeConfigChanged')
      .withArgs(1, 2, parseEther('0.01'));

    const cfg = await mminter._bridgeConfig(1);
    expect(cfg.minSigs).to.eq(2);
    expect(cfg.mintFee).to.eq(parseEther('0.01'));
    await expect(mminter.isBridgeEnabled(1)).to.eventually.eq(true);
    await expect(mminter.disableBridge(1)).to.emit(mminter, 'BridgeRemoved').withArgs(1);
    const cfg2 = await mminter._bridgeConfig(1);
    expect(cfg2.minSigs).to.eq(0);
    expect(cfg2.mintFee).to.eq(parseEther('0'));
    await expect(mminter.isBridgeEnabled(1)).to.eventually.eq(false);
  });
});
