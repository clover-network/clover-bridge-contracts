import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import chaiAsPromised, { transferPromiseness } from 'chai-as-promised';
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

    // native cross transfer should be disabled
    await expect(
      bridgeAlice.crossTransferNative(1, formatBytes32String('0x1'), {
        value: parseEther('1'),
      })
    ).to.eventually.rejectedWith('CloverBridge: invalid bridge method');
  });
  it('native cross transfer works', async function () {
    const [admin, alice] = await ethers.getSigners();

    const Bridge = await ethers.getContractFactory('CloverBridge');
    const bridge = await Bridge.deploy(ethers.constants.AddressZero);

    const bridgeBalance = parseEther('10000');

    await admin.sendTransaction({
      to: bridge.address,
      value: bridgeBalance,
    });

    const balance = await ethers.provider.getBalance(bridge.address);
    expect(balance).to.equal(bridgeBalance);

    const aliceInitialBalance = await alice.getBalance();

    const bridgeAlice = bridge.connect(alice);
    const tx = bridgeAlice.crossTransferNative(1, formatBytes32String('0x1'), {
      value: parseEther('100'),
    });
    await expect(tx).to.emit(bridge, 'CrossTransfered').withArgs(1, formatBytes32String('0x1'), parseEther('100'));
    const receipt = await (await tx).wait();
    const aliceBalanceAfter = await alice.getBalance();
    // need to check the balance and the fee used
    expect(aliceBalanceAfter.add(parseEther('100')).add(receipt.gasUsed.mul(receipt.effectiveGasPrice))).to.eq(aliceInitialBalance);
    await expect(ethers.provider.getBalance(bridge.address)).to.eventually.eq(parseEther('10100'));

    expect(
      bridgeAlice.crossTransferNative(1, formatBytes32String('0x1'), {
        value: parseEther('100000000'),
      })
    ).to.eventually.throws;

    await expect(bridgeAlice.crossTransfer(1, formatBytes32String('0x1'), parseEther('100'))).to.eventually.rejected;

    const balanceAdmin = await admin.getBalance();
    const txWithdraw = await bridge.withdraw(ethers.constants.AddressZero);
    const withdrawReceipt = await txWithdraw.wait();
    const balanceAdminAfter = await admin.getBalance();
    // check admin account received the native token
    expect(balanceAdminAfter.sub(parseEther('10100')).add(withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice))).to.be.eq(
      balanceAdmin
    );
    await expect(ethers.provider.getBalance(bridge.address)).to.eventually.eq(parseEther('0'));
  });
});
