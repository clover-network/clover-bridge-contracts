const fs = require("fs");
const path = require("path");

const buildPath = path.join(__dirname, "../build/contracts");
const data = {};

fs.readdirSync(buildPath).forEach(val => {
  let { contractName, abi, networks } = require(path.join(buildPath, val));
  if (!Object.keys(networks).length) return;

  const revisionIndex = contractName.lastIndexOf("_R");

  // If this contract is a revision, dont add address to list.
  if (revisionIndex > -1) {
    contractName = contractName.slice(0, revisionIndex);
  } else {
    data[contractName] = {};

    for (const networkData of Object.entries(networks)) {
      data[contractName] = networkData[1].address;
    }
  }

  fs.writeFileSync(path.join(__dirname, `../json_abi/${contractName}.json`), JSON.stringify(abi));

  data["network"] = networks[0];
});

fs.writeFileSync(path.join(__dirname, `../addresses.json`), JSON.stringify(data));
