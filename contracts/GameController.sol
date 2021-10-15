// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

import "hardhat/console.sol";

contract GameController is Ownable, Initializable {
    mapping(address => string) usernames;

    address howl;
    address nft;

    function initialize(address erc721) external initializer {
        //howl = erc20;
        nft = erc721;
    }

    //event UsernameChanged(address msgSender, uint256 lastUpdated);

    function getUsername() external view returns (string memory) {
        return usernames[msg.sender];
    }

    function setUsername(string memory newUsername) external {
        usernames[msg.sender] = newUsername;
    }

    struct TokenInfo {
        uint256 tokenId;
        address contractAddress;
        string URI;
    }

    function getUserNFT() external view returns (TokenInfo[] memory) {
        uint256 numToken = IERC721(nft).balanceOf(msg.sender);

        TokenInfo[] memory tokens = new TokenInfo[](numToken);

        for (uint256 i = 0; i < numToken; i++) {
            uint256 tokenId = ERC721Enumerable(nft).tokenOfOwnerByIndex(msg.sender, i);
            string memory uri = ERC721URIStorage(nft).tokenURI(tokenId);
            
            tokens[i] = TokenInfo(
                tokenId, address(nft), uri
            );
        }

        return tokens;
    }
}
