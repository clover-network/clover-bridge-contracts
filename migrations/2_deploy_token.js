const CloverToken = artifacts.require("CloverToken");

module.exports = async function (deployer, network) {
  const from = deployer.networks[network].from;

  await deployer.deploy(CloverToken);
  const instance = await CloverToken.deployed();
  await instance.grantRole(
    // the MINTER_ROLE hash
    '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', 
    '0x2130d613dda07091fb83b72aafe44ef00922b06d');

  await instance.grantRole(
    // the PAUSER_ROLE hash
    '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a', 
    '0x9dCd295E6e747Ae06Fa27c36bD4691D4c52a520a');

  await instance.grantRole(
    // the admin role hash
    '0x00', 
    '0x9dCd295E6e747Ae06Fa27c36bD4691D4c52a520a');

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
