const data = require("./data.json");

const main = async () => {
  const [account1, account2, account3] = await ethers.getSigners();

  console.log("Deploying token contract");

  // deploy token contract
  const Token = await ethers.getContractFactory(
    "contracts/RoboDogeCoin.sol:RoboDogeCoin"
  );
  const token = await Token.deploy();
  await token.deployed();

  console.log("Configuring token contract");

  // toggle force eop to true
  await token.connect(account1).toggleForceEop();

  // set rule to 10%
  await token.connect(account1).setRule(1000);

  console.log("Transferring tokens to users");

  // transfer 1Q tokens to accounts
  await token
    .connect(account1)
    .transfer(account2.address, "1000000000000000000000000");
  await token
    .connect(account1)
    .transfer(account3.address, "1000000000000000000000000");

  await token
    .connect(account1)
    .transfer(
      "0x92D981C51c574E300782cB80767eE9aBa75178ec",
      "1000000000000000000000000"
    );

  console.log("Deploying nft contract");

  // deploy nft contract
  const Nft = await ethers.getContractFactory(
    "contracts/RoboDogeNft.sol:RoboDogeNft"
  );
  const nft = await Nft.deploy("Robo", "RDC");
  await nft.deployed();

  console.log("Deploying marketplace contract");

  // deploy marketplace contract
  const Marketplace = await ethers.getContractFactory(
    "contracts/RoboDogeMarketplace.sol:RoboDogeMarketplace"
  );
  const marketplace = await Marketplace.deploy(
    nft.address,
    token.address,
    0,
    0,
    1000
  );
  await marketplace.deployed();

  console.log("Setting marketplace address for nft contract");

  // set marketplace contract address in nft contract
  await nft.connect(account1).setMarketplaceAddress(marketplace.address);

  console.log("Setting marketplace as LP address");

  await token
    .connect(account1)
    .setLiquidityPoolAddress(marketplace.address, true);

  console.log(`Token: ${token.address}`);
  console.log(`Nft: ${nft.address}`);
  console.log(`Marketplace: ${marketplace.address}`);

  // mint nft
  // await marketplace.connect(account1).mint(data[0].image, data[0].metadata, 5);
  // await marketplace.connect(account1).mint(data[1].image, data[1].metadata, 5);
  // await marketplace.connect(account2).mint(data[2].image, data[2].metadata, 5);
  // await marketplace.connect(account2).mint(data[3].image, data[3].metadata, 5);
  // await marketplace.connect(account3).mint(data[4].image, data[4].metadata, 5);

  // approve marketplace contract address and put on sale or auction
  // for (let i = 1; i <= 10; i++) {
  //   await nft.connect(account1).approve(marketplace.address, i);
  //   if (i % 2 == 0) {
  //     await marketplace
  //       .connect(account1)
  //       .putOnSale(i, "1000000000000000000", "0");
  //   } else {
  //     await marketplace
  //       .connect(account1)
  //       .startAuction(i, "1000000000000000", i, "1");
  //   }
  // }

  // for (let i = 11; i <= 20; i++) {
  //   await nft.connect(account2).approve(marketplace.address, i);
  //   if (i % 2 == 0) {
  //     await marketplace
  //       .connect(account2)
  //       .putOnSale(i, "1000000000000000000", "1");
  //   } else {
  //     await marketplace
  //       .connect(account2)
  //       .startAuction(i, "1000000000000000", i - 10, "0");
  //   }
  // }

  // for (let i = 21; i <= 25; i++) {
  //   await nft.connect(account3).approve(marketplace.address, i);
  //   if (i % 2 == 0) {
  //     await marketplace
  //       .connect(account3)
  //       .putOnSale(i, "1000000000000000000", "0");
  //   } else {
  //     await marketplace
  //       .connect(account3)
  //       .startAuction(i, "1000000000000000", i - 15, "1");
  //   }
  // }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
