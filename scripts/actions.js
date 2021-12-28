// user address
// token balance
// eop sell limit
// mint fee
// minimum token balance

import { create } from "ipfs-http-client";
const ipfs = create({ host: "ipfs.infura.io", port: 5001, protocol: "https" });

const captureFile = (e) => {
  const file = e.target.files[0];
  const reader = new window.FileReader();
  reader.readAsArrayBuffer(file);
  reader.onloadend = () => convertToBuffer(reader);
};

const convertToBuffer = (reader) => {
  const imageBuffer = Buffer.from(reader.result);
  setImageBuffer(imageBuffer);
};

const mint = async (imageBuffer, name, description, mediaType, count) => {
  try {
    const imageHash = (await ipfs.add(imageBuffer)).path;
    const metadataJSON = {
      name,
      description,
      mediaType,
      image: `https://ipfs.io/ipfs/${imageHash}`,
      attributes: {},
    };
    const metadata = (await ipfs.add(Buffer.from(JSON.stringify(metadataJSON))))
      .path;

    const mintFee = (
      Number(await marketplace.methods.mintFee().call()) * count
    ).toString();

    // create marketplace contract instance
    // fetch user address from web3 accounts

    const tx = await marketplace.methods
      .mint(imageHash, metadata, count)
      .send({ from: userAddress, value: mintFee });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const putOnSale = async (tokenId, price, currency) => {
  try {
    if (currency == "BNB") {
      price = web3.utils.toWei(price, "ether");
      currency = 1;
    } else {
      price = web3.utils.toWei(price, "gwei");
      currency = 0;
    }

    // create marketplace contract instance
    // fetch user address from web3 accounts

    await nft.methods
      .approve(marketplace._address, tokenId)
      .send({ from: userAddress });

    const tx = await marketplace.methods
      .putOnSale(tokenId, price, currency)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const updateSalePrice = async (tokenId, price, currency) => {
  try {
    if (currency == "BNB") {
      price = web3.utils.toWei(price, "ether");
      currency = 1;
    } else {
      price = web3.utils.toWei(price, "gwei");
      currency = 0;
    }

    // create marketplace contract instance
    // fetch user address from web3 accounts

    const tx = await marketplace.methods
      .updateSalePrice(tokenId, price, currency)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const removeFromSale = async (tokenId) => {
  try {
    // create marketplace contract instance
    // fetch user address from web3 accounts

    const tx = await marketplace.methods
      .removeFromSale(tokenId)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const buyNft = async (tokenId, price, saleCurrency, payWithCurrency) => {
  try {
    if (saleCurrency == "BNB") {
      price = web3.utils.toWei(price, "ether");
    } else {
      price = web3.utils.toWei(price, "gwei");
    }

    // create router contract instance
    // create marketplace contract instance
    // fetch user address from web3 accounts

    if (saleCurrency === "ROBODOGE" && payWithCurrency === "ROBODOGE") {
      await token.methods
        .approve(marketplace._address, price)
        .send({ from: userAddress });

      const tx = await marketplace.methods
        .buyNft(tokenId)
        .send({ from: userAddress });

      console.log(tx.transactionHash);
    } else if (saleCurrency === "BNB" && payWithCurrency === "BNB") {
      const tx = await marketplace.methods
        .buyNft(tokenId)
        .send({ from: userAddress, value: price });

      console.log(tx.transactionHash);
    } else if (saleCurrency === "ROBODOGE" && payWithCurrency === "BNB") {
      await router.methods
        .swapExactETHForTokens(
          0,
          ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", token._address],
          userAddress,
          Math.round(Date.now() / 1000) + 300
        )
        .send({
          from: userAddress,
          value: 0, // calc bnb to swap for `price` tokens
        });

      await token.methods
        .approve(marketplace._address, price)
        .send({ from: userAddress });

      const tx = await marketplace.methods
        .buyNft(tokenId)
        .send({ from: userAddress });

      console.log(tx.transactionHash);
    } else if (saleCurrency === "BNB" && payWithCurrency === "ROBODOGE") {
      await router.methods
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          0, // calculate tokens to swap for `price` bnb acc to eop,
          0,
          [token._address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
          userAddress,
          Math.round(Date.now() / 1000) + 300
        )
        .send({ from: userAddress, value: price });

      const tx = await marketplace.methods
        .buyNft(tokenId)
        .send({ from: userAddress, value: price });

      console.log(tx.transactionHash);
    }
  } catch (error) {
    console.log(error);
  }
};

const startAuction = async (tokenId, startingBid, duration, currency) => {
  try {
    if (currency == "BNB") {
      startingBid = web3.utils.toWei(startingBid, "ether");
      currency = 1;
    } else {
      startingBid = web3.utils.toWei(startingBid, "gwei");
      currency = 0;
    }

    // create marketplace contract instance
    // fetch user address from web3 accounts

    await nft.methods
      .approve(marketplace._address, tokenId)
      .send({ from: userAddress });

    const tx = await marketplace.methods
      .startAuction(tokenId, startingBid, duration, currency)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const deleteAuction = async (tokenId) => {
  try {
    // create marketplace contract instance
    // fetch user address from web3 accounts

    const tx = await marketplace.methods
      .deleteAuction(tokenId)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};

const placeBid = async (tokenId, bid, bidCurrency, payWithCurrency) => {
  try {
    if (bidCurrency == "BNB") {
      bid = web3.utils.toWei(bid, "ether");
    } else {
      bid = web3.utils.toWei(bid, "gwei");
    }

    // create router contract instance
    // create marketplace contract instance
    // fetch user address from web3 accounts

    if (bidCurrency === "ROBODOGE" && payWithCurrency === "ROBODOGE") {
      await token.methods
        .approve(marketplace._address, bid)
        .send({ from: userAddress });

      const tx = await marketplace.methods
        .placeBid(tokenId, bid)
        .send({ from: userAddress });

      console.log(tx.transactionHash);
    } else if (bidCurrency === "BNB" && payWithCurrency === "BNB") {
      const tx = await marketplace.methods
        .placeBid(tokenId, 0)
        .send({ from: userAddress, value: bid });

      console.log(tx.transactionHash);
    } else if (bidCurrency === "ROBODOGE" && payWithCurrency === "BNB") {
      await router.methods
        .swapExactETHForTokens(
          0,
          ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", token._address],
          userAddress,
          Math.round(Date.now() / 1000) + 300
        )
        .send({
          from: userAddress,
          value: 0, // calc bnb to swap for `price` tokens
        });

      await token.methods
        .approve(marketplace._address, bid)
        .send({ from: userAddress });

      const tx = await marketplace.methods
        .placeBid(tokenId, bid)
        .send({ from: userAddress });

      console.log(tx.transactionHash);
    } else if (bidCurrency === "BNB" && payWithCurrency === "ROBODOGE") {
      await router.methods
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          0, // calculate tokens to swap for `price` bnb acc to eop,
          0,
          [token._address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
          userAddress,
          Math.round(Date.now() / 1000) + 300
        )
        .send({ from: userAddress, value: bid });

      const tx = await marketplace.methods
        .buyNft(tokenId)
        .send({ from: userAddress, value: bid });

      console.log(tx.transactionHash);
    }
  } catch (error) {
    console.log(error);
  }
};

const claimAuctionNft = async (tokenId) => {
  try {
    // create marketplace contract instance
    // fetch user address from web3 accounts

    const tx = await marketplace.methods
      .claimAuctionNft(tokenId)
      .send({ from: userAddress });

    console.log(tx.transactionHash);
  } catch (error) {
    console.log(error);
  }
};
