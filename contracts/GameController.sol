// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "hardhat/console.sol";

contract GameController is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeMath for uint256;

    address public howl;
    address public nft;
    address private gameMaster;
    uint256 private ticketPrice;
    uint256 private hostingFeeX10;
    mapping(uint256 => uint256[]) private prizePercentX10;
    mapping(uint256 => uint256[]) private points;
    uint256[] private pvepoints;
    uint256[] private pveprizes;

    Counters.Counter private gameId;
    mapping(address => uint256) private playerToGameId;

    function initialize(address erc20, address erc721) external initializer {
        __Ownable_init();

        howl = erc20;
        nft = erc721;
        gameMaster = msg.sender;
        ticketPrice = uint256(10).mul(10 ** 18); // 10 HWL
        hostingFeeX10 = 50; // 5%

        prizePercentX10[2] = [950, 0];
        prizePercentX10[3] = [450, 300, 200];
        prizePercentX10[4] = [450, 300, 200, 0];
        prizePercentX10[5] = [450, 300, 200, 0, 0];
        prizePercentX10[6] = [450, 300, 200, 0, 0, 0];

        points[2] = [0, 1000];
        points[3] = [0, 2000, 1000];
        points[4] = [0, 0, 2000, 1000];
        points[5] = [0, 0, 0, 2000, 1000];
        points[6] = [0, 0, 0, 3000, 2000, 1000];

        pvepoints = [1000, 800, 500, 300, 100, 50];
        pveprizes = [10, 0, 0, 0, 0, 0];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }

    /**
     * Game Master
     */
    function getGameMaster() external view returns (address) {
        return gameMaster;
    }

    function setGameMaster(address newGameMaster) external onlyOwner {
        gameMaster = newGameMaster;
    }

    /**
     * Prize and point
     */
    function getPoint(uint256 room) external view returns (uint256[] memory) {
        return points[room];
    }

    function setPoint(uint256 room, uint256[] memory point) external onlyOwner {
        points[room] = point;
    }

    function getPrizePercent(uint256 room) external view returns (uint256[] memory) {
        return prizePercentX10[room];
    }

    function setPrizePercent(uint256 room, uint256[] memory percentX10) external onlyOwner {
        prizePercentX10[room] = percentX10;
    }

    function getPvEPoint() external view returns (uint256[] memory) {
        return pvepoints;
    }

    function setPvEPoint(uint256[] memory point) external onlyOwner {
        pvepoints = point;
    }

    function getPvEPrizes() external view returns (uint256[] memory) {
        return pveprizes;
    }

    function setPvEPrizes(uint256[] memory prizes) external onlyOwner {
        pveprizes = prizes;
    }

    /**
     * Ticket price
     */
    function getTicketPrice() external view returns (uint256) {
        return ticketPrice;
    }

    function setTicketPrice(uint256 newTicketPrice) external onlyOwner {
        require(newTicketPrice > 0, "Price must be at least 1 wei");
        ticketPrice = newTicketPrice;
    }
    
    /** 
     *  Players
     */
    struct Player {
        string name;
        uint256 ticket;
        uint256 point;
    }

    mapping(address => Player) players;

    event PvPRewarded(address gameMaster, address player, uint256 rank, uint256 token, uint256 point, uint256 time);
    event PvERewarded(address gameMaster, address player, uint256 rank, uint256 token, uint256 point, uint256 time);
    event TicketBought(address player, uint256 boughtQuantity, uint256 price);
    event GameStarted(uint256 gameid, address[] players, bool isActive);

    /**
     *  Player info
     */
    function getPlayerInfo() external view returns (Player memory) {
        return players[msg.sender];
    }

    function getPlayerInfoByAddress(address player) external view returns (Player memory) {
        return players[player];
    }

    /** 
     *  Player name
     */
    function setPlayerName(string memory newPlayerName) external {
        players[msg.sender].name = newPlayerName;
    }

    /**
     * Ticket
     */
    function buyTicket(uint256 numTicket) external {
        require(numTicket > 0, "Number of ticket to buy must be greater than 0");

        uint256 price = numTicket * ticketPrice;
        bool transfered = IERC20(howl).transferFrom(msg.sender, gameMaster, price);
        require(transfered, "Failed to transfer");

        players[msg.sender].ticket += numTicket;
        emit TicketBought(msg.sender, numTicket, price);
    }

    struct GameInfo {
        uint256 id;
        address[] players;
        bool isActive;
        mapping(address => bool) addressToRewarded;
    }

    mapping(uint256 => GameInfo) private games;

    /**
     *  Game
     */
    function startGame(address[] memory addresses) external onlyOwner returns (bool) {
        for (uint i = 0; i < addresses.length; i++) {
            require(players[msg.sender].ticket > 0, "Not enough ticket");
        }

        GameInfo storage game = games[1];
        game.id = 1;
        game.players = addresses;
        game.isActive = true;
        for (uint i = 0; i < addresses.length; i++) {
            game.addressToRewarded[addresses[i]] = false;
        }
        

        GameInfo storage game2 = games[2];
        game2.id = 2;
        game2.players = addresses;
        game2.isActive = true;
        for (uint i = 0; i < addresses.length; i++) {
            game2.addressToRewarded[addresses[i]] = true;
        }
    }

    function getGame(address[] memory addresses) external view returns (bool[] memory) {
        bool[] memory ret = new bool[](12);
        uint index = 0;
        for (uint i = 0; i < addresses.length; i++) {
            ret[index++] = games[1].addressToRewarded[addresses[i]];
        }
        for (uint i = 0; i < addresses.length; i++) {
            ret[index++] = games[2].addressToRewarded[addresses[i]];
        }
        return ret;
    }

    /**
     * Reward
     */
    function rewardPvP(address[] memory addresses) external onlyOwner {
        uint len = addresses.length;
        require((len > 1) && (len < 7), "Room must be greater than 1");
        _rewardPvP(addresses, prizePercentX10[len], points[len]);
    }

    function _rewardPvP(address[] memory player, uint256[] memory percentX10, uint256[] memory point) internal {
        uint len = player.length;
        uint pool = ticketPrice.mul(len);

        for (uint i = 0; i < player.length; i++) {
            uint256 prize = pool.mul(percentX10[i]).div(1000);
            if (prize > 0) {
                bool transfered = IERC20(howl).transferFrom(gameMaster, player[i], prize);
                require(transfered, "Failed to transfer");
            }
            players[player[i]].point += point[i];

            emit PvPRewarded(gameMaster, player[i], i + 1, prize, point[i], block.timestamp);
        }
    }
    
    function rewardPvE(address player, uint256 rank) external onlyOwner {
        require((rank > 0) && (rank < 7), "rank must be greater than 0 and smaller than 7");
        _rewardPvE(player, rank, pveprizes[rank - 1].mul(10 ** 18), pvepoints[rank - 1]);
    }

    function _rewardPvE(address player, uint256 rank, uint256 token, uint256 point) internal {
        if (rank == 1) {
            bool transfered = IERC20(howl).transferFrom(gameMaster, player, token);
            require(transfered, "Failed to transfer");
        }
        players[player].point += point;
        emit PvERewarded(gameMaster, player, rank, token, point, block.timestamp);
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
     
    function getPlayerNFTByAddress(address player) external view returns (TokenInfo[] memory) {
        uint256 numToken = IERC721(nft).balanceOf(player);

        TokenInfo[] memory tokens = new TokenInfo[](numToken);

        for (uint256 i = 0; i < numToken; i++) {
            uint256 tokenId = ERC721Enumerable(nft).tokenOfOwnerByIndex(player, i);
            string memory uri = ERC721URIStorage(nft).tokenURI(tokenId);
            
            tokens[i] = TokenInfo(
                tokenId, nft, uri
            );
        }

        return tokens;
    }
}
