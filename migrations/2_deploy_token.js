const CloverToken = artifacts.require("CloverToken");
const { accounts } = require('../env')

module.exports = async function (deployer, network) {
  const from = deployer.networks[network].from;

  await deployer.deploy(CloverToken);
  const instance = await CloverToken.deployed();
  await instance.grantRole(
    // the MINTER_ROLE hash
    '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', 
    accounts.minter);

  await instance.grantRole(
    // the PAUSER_ROLE hash
    '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a', 
    accounts.pauser);

  await instance.grantRole(
    // the admin role hash
    '0x00', 
    accounts.admin);

  // revoke deployer roles
  await instance.revokeRole(
    '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    from
  );

  await instance.revokeRole(
    '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a',
    from
  );
  await instance.revokeRole(
    '0x00',
    from
  );
};
