const CloverToken = artifacts.require("CloverToken");
const CloverBridge = artifacts.require("CloverBridge");

module.exports = async function (deployer, network) {
  const from = deployer.networks[network].from;
  await deployer.deploy(CloverBridge, CloverToken.address);
  const instance = await CloverBridge.deployed();
  await instance.grantRole(
    // the BRIDGE_ROLE hash
    '0x52ba824bfabc2bcfcdf7f0edbb486ebb05e1836c90e78047efeb949990f72e5f', 
    '0xe19568b681b565640dddfb8d5acc5f375b7579f0');

  await instance.grantRole(
    // the admin role hash
    '0x00', 
    '0x9dCd295E6e747Ae06Fa27c36bD4691D4c52a520a');

  // revoke deployer roles
  await instance.revokeRole(
    '0x52ba824bfabc2bcfcdf7f0edbb486ebb05e1836c90e78047efeb949990f72e5f',
    from
  );

  await instance.revokeRole(
    '0x00',
    from
  );

};
