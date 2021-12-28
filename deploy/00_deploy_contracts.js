module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const Token = await ethers.getContractFactory(
    "contracts/RoboDogeCoin.sol:RoboDogeCoin"
  );
  const token = await Token.deploy();
  await token.deployed();

  const Nft = await ethers.getContractFactory(
    "contracts/RoboDogeNft.sol:RoboDogeNft"
  );
  const nft = await Nft.deploy();
  await nft.deployed();

  const Marketplace = await ethers.getContractFactory(
    "contracts/RoboDogeMarketplace.sol:RoboDogeMarketplace"
  );
  const marketplace = await Marketplace.deploy();
  await marketplace.deployed();

  console.log(`Token: ${token.address}`);
  console.log(`Nft: ${nft.address}`);
  console.log(`Marketplace: ${marketplace.address}`);

  // const contract = await deploy("contracts/RoboDogeCoin.sol:RoboDogeCoin", {
  //   from: deployer,
  //   gasLimit: 4000000,
  //   args: [],
  // });
};

module.exports.tags = ["RoboDogeCoin"];
