// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";

interface RoboDogeNft {
    function exists(uint256 _id) external returns (bool);
}

contract RoboDogeItemRemover is Ownable {
    RoboDogeNft private nft;

    mapping(uint256 => bool) public hidden;

    event RemoveNft(uint256 id);
    event AddNft(uint256 id);

    constructor(address _nft) {
        nft = RoboDogeNft(_nft);
    }

    function removeItems(uint256[] memory nfts) external onlyOwner {
        for (uint256 i = 0; i < nfts.length; i++) {
            require(nft.exists(i), "Item does not exist");
            hidden[i] = true;
            emit RemoveNft(i);
        }
    }

    function removeItem(uint256 _id) external onlyOwner {
        require(nft.exists(_id), "Item does not exist");
        hidden[_id] = true;
        emit RemoveNft(_id);
    }

    function addItems(uint256[] memory nfts) external onlyOwner {
        for (uint256 i = 0; i < nfts.length; i++) {
            require(nft.exists(i), "Item does not exist");
            hidden[i] = false;
            emit AddNft(i);
        }
    }

    function addItem(uint256 _id) external onlyOwner {
        require(nft.exists(_id), "Item does not exist");
        hidden[_id] = false;
        emit AddNft(_id);
    }
}
