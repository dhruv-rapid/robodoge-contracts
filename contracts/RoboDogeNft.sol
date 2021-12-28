// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoboDogeNft is ERC721URIStorage, Ownable {
    string public baseURI;
    uint256 public tokenCounter;
    address public marketplaceAddress;

    modifier onlyMarketplace() {
        require(
            msg.sender == marketplaceAddress,
            "Caller not marketplace contract"
        );
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        baseURI = "https://ipfs.io/ipfs/";
    }

    function mint(
        address _owner,
        string memory _metadata,
        uint256 _count
    ) external onlyMarketplace {
        for (uint256 i = 0; i < _count; i++) {
            _safeMint(_owner, ++tokenCounter);
            _setTokenURI(tokenCounter, _metadata);
        }
    }

    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    function setMarketplaceAddress(address _marketplaceAddress)
        external
        onlyOwner
    {
        marketplaceAddress = _marketplaceAddress;
    }

    function setBaseURI(string memory _baseUri) external onlyOwner {
        baseURI = _baseUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
