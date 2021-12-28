// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface RoboDogeCoin {
    function balanceOf(address _address) external view returns (uint256);

    function transfer(address to, uint256 amount) external;

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;
}

interface RoboDogeNft {
    function mint(
        address _owner,
        string memory _metadata,
        uint256 _count
    ) external;

    function ownerOf(uint256 _tokenId) external view returns (address);

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

contract RoboDogeStakingNftMarketplace is Ownable, ReentrancyGuard {
    RoboDogeCoin private token;
    RoboDogeNft private nft;

    uint256 private constant DENOMINATOR = 10000;
    uint256 public constant MAX_AUCTION_DURATION = 14;
    uint256 public constant MIN_BID_RISE = 500;

    enum Currency {
        TOKEN,
        BNB
    }

    struct Sale {
        uint256 id;
        address originalOwner;
        uint256 price;
        Currency currency;
    }

    struct Auction {
        uint256 id;
        address originalOwner;
        uint256 startingBid;
        uint256 startingTime;
        uint256 duration;
        address highestBidder;
        uint256 highestBid;
        Currency currency;
    }

    uint256 public royalty;
    uint256 public minTokenBalance;
    uint256 public saleCounter;
    uint256 public auctionCounter;
    uint256 public tokenRoyaltyReceived;
    uint256 public bnbRoyaltyReceived;
    uint256 public auctionDurationIncrease;

    mapping(string => bool) public exists;
    mapping(uint256 => Sale) public nftSales;
    mapping(uint256 => Auction) public auctions;

    event NFTPutOnSale(
        uint256 indexed saleId,
        uint256 indexed tokenId,
        uint256 price,
        Currency currency
    );
    event NFTSalePriceUpdated(
        uint256 indexed saleId,
        uint256 tokenId,
        uint256 price,
        Currency currency
    );
    event NFTRemovedFromSale(uint256 indexed saleId, uint256 indexed tokenId);
    event NFTSold(
        uint256 indexed saleId,
        uint256 indexed tokenId,
        uint256 price,
        Currency currency
    );
    event AuctionStart(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        uint256 startingBid,
        uint256 startingTime,
        uint256 duration,
        Currency currency
    );
    event AuctionCancel(uint256 indexed auctionId, uint256 indexed tokenId);
    event PlaceBid(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        uint256 bid
    );
    event AuctionEnd(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address highestBidder,
        uint256 highestBid
    );

    modifier isSaleOwner(uint256 _tokenId) {
        require(
            msg.sender == nftSales[_tokenId].originalOwner,
            "Only owner can call"
        );
        _;
    }

    modifier isAuctionOwner(uint256 _tokenId) {
        require(
            msg.sender == auctions[_tokenId].originalOwner,
            "Only owner can call"
        );
        _;
    }

    modifier isOnSale(uint256 _tokenId) {
        require(
            nftSales[_tokenId].price > 0 &&
                address(this) == nft.ownerOf(_tokenId),
            "NFT is not on sale"
        );
        _;
    }

    modifier notOnSale(uint256 _tokenId) {
        require(nftSales[_tokenId].price == 0, "NFT is on sale");
        _;
    }

    modifier isOnAuction(uint256 _tokenId) {
        require(
            auctions[_tokenId].startingTime > 0 &&
                address(this) == nft.ownerOf(_tokenId),
            "NFT not being auctioned"
        );
        _;
    }

    modifier notOnAuction(uint256 _tokenId) {
        require(
            auctions[_tokenId].startingTime == 0,
            "NFT already being auctioned"
        );
        _;
    }

    constructor(
        address _nft,
        address _token,
        uint256 _minTokenBalance,
        uint256 _royalty,
        uint256 _auctionDurationIncrease
    ) {
        token = RoboDogeCoin(_token);
        nft = RoboDogeNft(_nft);
        minTokenBalance = _minTokenBalance;
        royalty = _royalty;
        auctionDurationIncrease = _auctionDurationIncrease;
    }

    // approve first
    function putOnSale(
        uint256 _tokenId,
        uint256 _price,
        Currency _currency
    ) external notOnSale(_tokenId) notOnAuction(_tokenId) {
        require(_price > 0, "Price cannot be zero");
        require(msg.sender == nft.ownerOf(_tokenId), "Only owner can call");

        nftSales[_tokenId] = Sale(++saleCounter, msg.sender, _price, _currency);

        nft.transferFrom(msg.sender, address(this), _tokenId);

        emit NFTPutOnSale(saleCounter, _tokenId, _price, _currency);
    }

    function updateSalePrice(
        uint256 _tokenId,
        uint256 _price,
        Currency _currency
    ) external isSaleOwner(_tokenId) isOnSale(_tokenId) {
        require(_price > 0, "Price cannot be zero");

        nftSales[_tokenId].price = _price;
        nftSales[_tokenId].currency = _currency;

        emit NFTSalePriceUpdated(
            nftSales[_tokenId].id,
            _tokenId,
            _price,
            _currency
        );
    }

    function removeFromSale(uint256 _tokenId)
        external
        isSaleOwner(_tokenId)
        isOnSale(_tokenId)
    {
        uint256 saleId = nftSales[_tokenId].id;
        delete nftSales[_tokenId];

        nft.transferFrom(address(this), msg.sender, _tokenId);

        emit NFTRemovedFromSale(saleId, _tokenId);
    }

    function buyNft(uint256 _tokenId)
        external
        payable
        nonReentrant
        isOnSale(_tokenId)
    {
        require(
            nftSales[_tokenId].currency == Currency.TOKEN ||
                msg.value >= nftSales[_tokenId].price,
            "Insufficient funds sent"
        );

        address originalOwner = nftSales[_tokenId].originalOwner;
        uint256 price = nftSales[_tokenId].price;
        uint256 royaltyFee = (price * royalty) / DENOMINATOR;
        uint256 saleId = nftSales[_tokenId].id;
        Currency currency = nftSales[_tokenId].currency;

        delete nftSales[_tokenId];

        if (currency == Currency.BNB) {
            payable(originalOwner).transfer(price - royaltyFee);
            payable(msg.sender).transfer(msg.value - price);

            bnbRoyaltyReceived += royaltyFee;
        } else {
            token.transferFrom(msg.sender, originalOwner, price - royaltyFee);
            token.transferFrom(msg.sender, address(this), royaltyFee);
            payable(msg.sender).transfer(msg.value);

            tokenRoyaltyReceived += royaltyFee;
        }

        nft.transferFrom(address(this), msg.sender, _tokenId);

        emit NFTSold(saleId, _tokenId, price, currency);
    }

    // approve first
    function startAuction(
        uint256 _tokenId,
        uint256 _startingBid,
        uint256 _duration,
        Currency _currency
    ) external notOnSale(_tokenId) notOnAuction(_tokenId) {
        require(msg.sender == nft.ownerOf(_tokenId), "Only owner can call");
        require(_duration <= MAX_AUCTION_DURATION, "Decrease auction duration");

        auctions[_tokenId] = Auction(
            ++auctionCounter,
            msg.sender,
            _startingBid,
            block.timestamp,
            _duration * 1 days,
            address(0),
            0,
            _currency
        );

        nft.transferFrom(msg.sender, address(this), _tokenId);

        emit AuctionStart(
            auctionCounter,
            _tokenId,
            _startingBid,
            block.timestamp,
            _duration * 1 days,
            _currency
        );
    }

    function deleteAuction(uint256 _tokenId)
        external
        isAuctionOwner(_tokenId)
        isOnAuction(_tokenId)
    {
        require(
            auctions[_tokenId].highestBid == 0,
            "Cannot delete once bid is placed"
        );

        uint256 auctionId = auctions[_tokenId].id;
        delete auctions[_tokenId];

        nft.transferFrom(address(this), msg.sender, _tokenId);

        emit AuctionCancel(auctionId, _tokenId);
    }

    function placeBid(uint256 _tokenId, uint256 _bid)
        external
        payable
        nonReentrant
        isOnAuction(_tokenId)
    {
        Auction storage item = auctions[_tokenId];

        uint256 bid = item.currency == Currency.BNB ? msg.value : _bid;
        uint256 auctionEndTime = item.startingTime + item.duration;

        require(bid >= nextAllowedBid(_tokenId), "Increase bid");
        require(block.timestamp <= auctionEndTime, "Auction duration ended");

        uint256 prevBid = item.highestBid;
        address prevBidder = item.highestBidder;

        item.highestBid = bid;
        item.highestBidder = msg.sender;

        if (block.timestamp >= auctionEndTime - 10 minutes) {
            item.duration += auctionDurationIncrease * 1 minutes;
        }

        if (item.currency == Currency.BNB) {
            payable(prevBidder).transfer(prevBid);
        } else {
            if (prevBidder != address(0)) {
                token.transfer(prevBidder, prevBid);
            }
            // check for eop limit
            token.transferFrom(msg.sender, address(this), bid);
        }

        emit PlaceBid(item.id, _tokenId, bid);
    }

    function claimAuctionNft(uint256 _tokenId)
        external
        nonReentrant
        isOnAuction(_tokenId)
    {
        Auction memory item = auctions[_tokenId];

        require(
            (msg.sender == item.highestBidder &&
                block.timestamp > item.startingTime + item.duration) ||
                msg.sender == item.originalOwner,
            "Only highest bidder or owner can call"
        );

        Currency currency = item.currency;
        address originalOwner = item.originalOwner;
        uint256 highestBid = item.highestBid;
        address highestBidder = item.highestBidder;
        uint256 royaltyFee = (highestBid * royalty) / DENOMINATOR;
        uint256 auctionId = auctions[_tokenId].id;

        delete auctions[_tokenId];

        if (currency == Currency.BNB) {
            payable(originalOwner).transfer(highestBid - royaltyFee);

            bnbRoyaltyReceived += royaltyFee;
        } else {
            token.transfer(originalOwner, highestBid - royaltyFee);

            tokenRoyaltyReceived += royaltyFee;
        }

        nft.transferFrom(address(this), highestBidder, _tokenId);

        emit AuctionEnd(auctionId, _tokenId, highestBidder, highestBid);
    }

    // ------------ VIEW FUNCTIONS ------------

    function canClaimAuctionNft(address _address, uint256 _tokenId)
        external
        view
        isOnAuction(_tokenId)
        returns (bool)
    {
        Auction memory item = auctions[_tokenId];
        return (item.highestBid > 0 &&
            ((block.timestamp > item.startingTime + item.duration &&
                _address == item.highestBidder) ||
                _address == item.originalOwner));
    }

    function nextAllowedBid(uint256 _tokenId)
        public
        view
        isOnAuction(_tokenId)
        returns (uint256)
    {
        Auction memory item = auctions[_tokenId];
        return
            item.highestBid == 0
                ? item.startingBid
                : item.highestBid +
                    (item.highestBid * MIN_BID_RISE) /
                    DENOMINATOR;
    }

    // ------------ ONLY OWNER FUNCTIONS ------------

    function updateRoyaltyFee(uint256 _royaltyFee) external onlyOwner {
        royalty = _royaltyFee;
    }

    function updateAuctionDurationIncrease(uint256 _auctionDurationIncrease)
        external
        onlyOwner
    {
        auctionDurationIncrease = _auctionDurationIncrease;
    }

    function updateMinimumTokenBalance(uint256 _minTokenBalance)
        external
        onlyOwner
    {
        minTokenBalance = _minTokenBalance;
    }

    function withdrawRoyalty(address payable _address) external onlyOwner {
        require(_address != address(0), "Address cannot be zero address");

        _address.transfer(bnbRoyaltyReceived);
        token.transfer(_address, tokenRoyaltyReceived);
    }

    receive() external payable {}
}
