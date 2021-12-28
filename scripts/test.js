const data = require("./data.json");
const tokenABI =
  require("../artifacts/contracts/RoboDogeCoin.sol/RoboDogeCoin.json").abi;
const nftABI =
  require("../artifacts/contracts/RoboDogeNft.sol/RoboDogeNft.json").abi;
const marketplaceABI =
  require("../artifacts/contracts/RoboDogeMarketplace.sol/RoboDogeMarketplace.json").abi;
const stakingABI =
  require("../artifacts/contracts/RoboDogeStaking.sol/RoboDogeStaking.json").abi;
const stakingNftABI =
  require("../artifacts/contracts/RoboDogeStakingNft.sol/RoboDogeStakingNft.json").abi;
const stakingMarketplaceABI =
  require("../artifacts/contracts/RoboDogeStakingNftMarketplace.sol/RoboDogeStakingNftMarketplace.json").abi;

const setup = async () => {
  const [account1, account2, account3] = await ethers.getSigners();

  // deploy token contract
  const Token = await ethers.getContractFactory(
    "contracts/RoboDogeCoin.sol:RoboDogeCoin"
  );
  const token = await Token.deploy();
  await token.deployed();

  // toggle force eop to true
  await token.connect(account1).toggleForceEop();

  // set rule to 10%
  await token.connect(account1).setRule(1000);

  // transfer 1Q tokens to accounts
  await token
    .connect(account1)
    .transfer(account2.address, "1000000000000000000000000");
  await token
    .connect(account1)
    .transfer(account3.address, "1000000000000000000000000");

  // deploy nft contract
  const Nft = await ethers.getContractFactory(
    "contracts/RoboDogeNft.sol:RoboDogeNft"
  );
  const nft = await Nft.deploy("Robo", "RDC");
  await nft.deployed();

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

  // set marketplace as LP address to avoid EOP
  await token
    .connect(account1)
    .setLiquidityPoolAddress(marketplace.address, true);

  // set marketplace contract address in nft contract
  await nft.connect(account1).setMarketplaceAddress(marketplace.address);

  // give approval to marketplace for sales and auctions
  await token
    .connect(account1)
    .approve(marketplace.address, "1000000000000000000000000");
  await token
    .connect(account2)
    .approve(marketplace.address, "1000000000000000000000000");
  await token
    .connect(account3)
    .approve(marketplace.address, "1000000000000000000000000");

  console.log(`Token: ${token.address}`);
  console.log(`Nft: ${nft.address}`);
  console.log(`Marketplace: ${marketplace.address}`);
};

const marketplace = async () => {
  const [account1, account2, account3] = await ethers.getSigners();

  // const tokenAddress = "0xE4D7b0F6485D3e2A0C7448FcE6DFd5693dB4DeDA";
  const tokenAddress = "0x5c6BaE151567c7a38e1988D760dD49D3f8F9DBe1";
  // const nftAddress = "0x5e74c656b269893e31E578E8004fD321cAcd0Ad6";
  const nftAddress = "0x2316c3b9e44b726841Ca1FE60f0A3886A5F7fdf3";
  // const marketplaceAddress = "0x66048F3aF1D2a4Ee022aE43f6f2B7a338618Ca44";
  const marketplaceAddress = "0x2387eAC61c2C3C5eA7719eF42BB04449e77Ba3C0";

  const token = new ethers.Contract(tokenAddress, tokenABI, account1);
  const nft = new ethers.Contract(nftAddress, nftABI, account1);
  const marketplace = new ethers.Contract(
    marketplaceAddress,
    marketplaceABI,
    account1
  );

  // await token.connect(account1).setRule(1000);
  // const { amountSpent, spendLimit } = await token.userInfos(
  //   "0x92d981c51c574e300782cb80767ee9aba75178ec"
  // );

  // console.log(Number(await token.rule()) / 100);

  // console.log(`Spend limit: ${Number(spendLimit) / 10 ** 9}`);
  // console.log(`Amount spent: ${Number(amountSpent) / 10 ** 9}`);
  // console.log(`Amount left: ${Number(spendLimit - amountSpent) / 10 ** 9}`);

  await token.connect(account2).approve(marketplace.address, "8000000000000");
  const tx = await marketplace
    .connect(account2)
    .placeBid(26, "8000000000000", { gasLimit: "10000000" });

  const receipt = await tx.wait();

  console.log(receipt.transactionHash);

  // mint 3 tokens
  // await marketplace.connect(account1).mint(data[0].image, data[0].metadata, 3);

  // await nft.connect(account1).approve(marketplace.address, 2);
  // await nft.connect(account1).approve(marketplace.address, 3);

  // const prevOwner = await nft.ownerOf(2);
  // console.log(`Previous owner: ${prevOwner}`);

  // put token 1 on sale for 1M tokens
  // await nft.connect(account1).approve(marketplace.address, 2);
  // await marketplace.connect(account1).putOnSale(2, "1000000000000000000", 1);
  // await marketplace.connect(account1).updateSalePrice(1, "1000000000000000", 0);
  // await marketplace.connect(account1).removeFromSale(1);

  // console.log(await marketplace.nftSales(2));

  // await token
  //   .connect(account2)
  //   .approve(marketplace.address, "1000000000000000000");
  // await marketplace
  //   .connect(account2)
  //   .buyNft(2, { value: "10000000000000000000" });

  // console.log(Number(await token.balanceOf(marketplace.address)) / 1e9);
  // console.log(Number(await token.balanceOf(account1.address)) / 1e9);
  // console.log(Number(await token.balanceOf(account2.address)) / 1e9);

  // const newOwner = await nft.ownerOf(2);
  // console.log(`New owner: ${newOwner}`);
};

const staking = async () => {
  const [account1, account2, account3] = await ethers.getSigners();

  const tokenAddress = "0x7E5DF688b10aA0C0cC1bE89696f225301F99cB2A";
  const nftAddress = "0x0fC1a5B4F310a267f676b8D44EC5b8C462b2296A";
  const marketplaceAddress = "0xc30465E3bFDA156C3A37454d65E96424B8c5f453";
  const stakingAddress = "0x3Cef0C5022E85aBF9213CABD84799F92c6CfbB5c";
  const stakingNftAddress = "0x3868a3D9501b938114995BDf216F237cEF8D73e5";
  const stakingNftMpAddress = "0x653efFb829035B64F7De04e226ec64b593b67c14";

  const token = new ethers.Contract(tokenAddress, tokenABI, account1);
  const staking = new ethers.Contract(stakingAddress, stakingABI);
  const marketplace = new ethers.Contract(
    marketplaceAddress,
    marketplaceABI,
    account1
  );
  const stakingNft = new ethers.Contract(stakingNftAddress, stakingNftABI);
  const stakingMp = new ethers.Contract(
    stakingNftMpAddress,
    stakingMarketplaceABI
  );

  // const Staking = await ethers.getContractFactory(
  //   "contracts/RoboDogeStaking.sol:RoboDogeStaking"
  // );
  // const staking = await Staking.deploy(tokenAddress);
  // await staking.deployed();

  // const StakingNft = await ethers.getContractFactory(
  //   "contracts/RoboDogeStakingNft.sol:RoboDogeStakingNft"
  // );
  // const stakingNft = await StakingNft.deploy("SRobo", "sROBO", staking.address);
  // await stakingNft.deployed();

  // const StakingMp = await ethers.getContractFactory(
  //   "contracts/RoboDogeStakingNftMarketplace.sol:RoboDogeStakingNftMarketplace"
  // );
  // const stakingMp = await StakingMp.deploy(
  //   stakingNft.address,
  //   tokenAddress,
  //   0,
  //   1000,
  //   10
  // );
  // await stakingMp.deployed();

  // console.log(`Staking: ${staking.address}`);
  // console.log(`Staking NFT: ${stakingNft.address}`);
  // console.log(`Staking MP: ${stakingMp.address}`);

  // await token.connect(account1).setRule(5000);
  // await token.connect(account1).transferOwnership(staking.address);

  // await token
  //   .connect(account1)
  //   .approve(staking.address, "1000000000000000000000");
  // await token
  //   .connect(account2)
  //   .approve(staking.address, "5000000000000000000000");
  // await token
  //   .connect(account3)
  //   .approve(staking.address, "15000000000000000000000");

  // await staking.connect(account1).stakeToken("1000000000000000000000", 6);
  // await staking.connect(account2).stakeToken("5000000000000000000000", 6);
  // await staking.connect(account3).stakeToken("15000000000000000000000", 6);

  // await stakingNft
  //   .connect(account1)
  //   .addToCollection(data[0].image, data[0].metadata, 0, 10);
  // await stakingNft
  //   .connect(account1)
  //   .addToCollection(data[1].image, data[1].metadata, 1, 10);
  // await stakingNft
  //   .connect(account1)
  //   .addToCollection(data[2].image, data[2].metadata, 2, 10);

  // await stakingNft.connect(account1).claimNFT(0);
  // await stakingNft.connect(account2).claimNFT(0);
  // await stakingNft.connect(account3).claimNFT(0);

  // await stakingNft.connect(account2).approve(stakingMp.address, 2);
  // await stakingNft.connect(account3).approve(stakingMp.address, 3);

  // await (
  //   await stakingMp
  //     .connect(account2)
  //     .putOnSale(2, "1000000000000000", "0", { gasLimit: "300000" })
  // ).wait();
  // await (
  //   await stakingMp
  //     .connect(account3)
  //     .putOnSale(3, "1000000000000000", "1", { gasLimit: "300000" })
  // ).wait();

  // await (
  //   await stakingNft.connect(account1).approve(stakingMp.address, 1)
  // ).wait();
  // await (
  //   await stakingMp.connect(account1).startAuction(1, "1000000000000000", 3, 0)
  // ).wait();

  // await token
  //   .connect(account2)
  //   .approve(
  //     stakingMp.address,
  //     "100000000000000000000000000000000000000000000"
  //   );
  // await (
  //   await stakingMp.connect(account2).placeBid(1, "1200000000000000")
  // ).wait();

  await staking.connect(account1).setRule(3000);
  await staking.connect(account1).setRestrictionDuration(60);

  await marketplace.connect(account1).updateMintFee(700);
};

staking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
