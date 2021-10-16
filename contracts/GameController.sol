// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "hardhat/console.sol";

contract GameController is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    address howl;
    address nft;

    function initialize(address erc20, address erc721) external initializer {
        __Ownable_init();

        howl = erc20;
        nft = erc721;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }
    
    /** 
     *  Players
     */
    struct Player {
        string name;
        uint256 fuel;
    }

    mapping(address => Player) players;

    /** 
     *  Player name
     */
    function getPlayerName() external view returns (string memory) {
        return players[msg.sender].name;
    }

    function setPlayerName(string memory newPlayerName) external {
        players[msg.sender].name = newPlayerName;
    }

    /**
     * Fuel
     */
    function getPlayerFuel() external view returns (uint256){
        return players[msg.sender].fuel;
    }

    function setPlayerFuel(address player, uint256 fuel) external onlyOwner {
        players[player].fuel = fuel;
    }

    /**
     * Reward
     */
    function reward() external onlyOwner {
        
    }
    

    /**
     * NFT
     */
    struct TokenInfo {
        uint256 tokenId;
        address contractAddress;
        string URI;
    }

    function getPlayerNFT() external view returns (TokenInfo[] memory) {
        uint256 numToken = IERC721(nft).balanceOf(msg.sender);

        TokenInfo[] memory tokens = new TokenInfo[](numToken);

        for (uint256 i = 0; i < numToken; i++) {
            uint256 tokenId = ERC721Enumerable(nft).tokenOfOwnerByIndex(msg.sender, i);
            string memory uri = ERC721URIStorage(nft).tokenURI(tokenId);
            
            tokens[i] = TokenInfo(
                tokenId, nft, uri
            );
        }

        return tokens;
    }
}
