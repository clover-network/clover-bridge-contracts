import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import chaiAsPromised from 'chai-as-promised';
import { formatBytes32String, parseEther } from 'ethers/lib/utils';
chai.use(chaiAsPromised);

describe('bridge contract', function () {
  it('cross chain transfer works', async function () {
    const [, alice] = await ethers.getSigners();

    const CLV = await ethers.getContractFactory('CloverToken');
    const clv = await CLV.deploy();

    const Bridge = await ethers.getContractFactory('CloverBridge');
    const bridge = await Bridge.deploy(clv.address);

    const bridgeBalance = parseEther('10000');
    await expect(clv.mint(bridge.address, bridgeBalance)).to.eventually.ok;

    const balance = await clv.balanceOf(bridge.address);
    expect(balance).to.equal(bridgeBalance);

    await clv.mint(alice.address, parseEther('1000'));

    const clvAlice = clv.connect(alice);
    const bridgeAlice = bridge.connect(alice);
    await clvAlice.approve(bridge.address, parseEther('1000'));
    await expect(bridgeAlice.crossTransfer(1, formatBytes32String('0x1'), parseEther('100')))
      .to.emit(bridge, 'CrossTransfered')
      .withArgs(1, formatBytes32String('0x1'), parseEther('100'));
    await expect(clv.balanceOf(alice.address)).to.eventually.eq(parseEther('900'));
    await expect(clv.balanceOf(bridge.address)).to.eventually.eq(parseEther('10100'));
    await expect(clv.allowance(alice.address, bridge.address)).to.eventually.eq(parseEther('900'));

    await expect(bridgeAlice.crossTransfer(1, formatBytes32String('0x1'), parseEther('1000'))).to.rejectedWith(
      'ERC20: insufficient allowance'
    );
  });

  it('cross chain mint works', async function () {
    const [admin, alice, minter] = await ethers.getSigners();

    const CLV = await ethers.getContractFactory('CloverToken');
    const clv = await CLV.deploy();

    const Bridge = await ethers.getContractFactory('CloverBridge');
    const bridge = await Bridge.deploy(clv.address);

    // setup minter role
    await bridge.grantRole(await bridge.BRIDGE_ROLE(), minter.address);

    const bridgeBalance = parseEther('10000');
    await expect(clv.mint(bridge.address, bridgeBalance)).to.eventually.ok;

    const bridgeMinter = bridge.connect(minter);

    await expect(bridgeMinter.isMinted(1, formatBytes32String('0x0011'))).to.eventually.equal(false);

    await expect(bridgeMinter.mintTransaction(1, formatBytes32String('0x0011'), alice.address, parseEther('100')))
      .to.emit(bridge, 'TransactionMinted')
      .withArgs(1, formatBytes32String('0x0011'), alice.address, parseEther('100'));
    await expect(clv.balanceOf(alice.address)).to.eventually.eq(parseEther('100'));
    await expect(clv.balanceOf(bridge.address)).to.eventually.eq(parseEther('9900'));

    await expect(bridgeMinter.isMinted(1, formatBytes32String('0x0011'))).to.eventually.equal(true);

    await expect(bridgeMinter.mintTransaction(1, formatBytes32String('0x0011'), alice.address, parseEther('100'))).to.rejectedWith(
      'CloverBridge: tx already minted!'
    );

    // only minter can mint transactions
    const bridgeAlice = bridge.connect(alice);
    await expect(bridgeAlice.mintTransaction(1, formatBytes32String('0x0012'), alice.address, parseEther('100'))).to.rejectedWith(
      'CloverBridge: bridge role'
    );

    await bridge.withdraw(clv.address);
    await expect(clv.balanceOf(bridge.address)).to.eventually.eq('0');
    await expect(clv.balanceOf(admin.address)).to.eventually.eq(parseEther('9900'));
  });
});
