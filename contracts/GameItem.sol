// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GameItem is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable, ERC721Burnable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("GameItem", "GIT") {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to) public onlyOwner {
        _safeMint(to, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function approveAddress(address addr) external {
        setApprovalForAll(addr, true);
    }

    /**
     * Game item
     */
    struct Item {
        uint256 itemId;
        uint256 star;
    }

    mapping(uint256 => Item) public gameItems;

    event ItemUpgraded(uint256 tokenId, uint256 itemId, uint256 oldStar, uint256 newStar);

    function getGameItem(uint256 tokenId) external view returns (Item memory) {
        return gameItems[tokenId];
    }

    function createGameItem(address user, string memory uri, uint256 itemId, uint8 star) external {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _createGameItem(newTokenId, itemId, star);
        _safeMint(user, newTokenId);
        _setTokenURI(newTokenId, uri);
    }

    function _createGameItem(uint256 tokenId, uint256 itemId, uint256 star) internal {
        gameItems[tokenId] = Item(itemId, star);
    }

    function upgradeGameItem(uint256 tokenId) external onlyOwner {
        Item storage item = gameItems[tokenId];
        require(item.star < 5, "Number of star is already max");

        item.star += 1;

        emit ItemUpgraded(tokenId, item.itemId, item.star - 1, item.star);
    }
}

