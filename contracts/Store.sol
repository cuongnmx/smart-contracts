// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/IGameItem.sol";
import "./interfaces/IGameController.sol";

contract Store is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable {

    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 public ticketPrice;
    address public feeReceiver;

    address public howl;
    address public gameitem;

    function initialize(address erc20, address erc721) external initializer {
        __Ownable_init();

        howl = erc20;
        gameitem = erc721;

        ticketPrice = uint256(10).mul(10 ** 18); // 10 HWL
        feeReceiver = msg.sender;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }

    /**
     *  game controller
     */
    IGameController public gameController;
    function setGameController(address controllerAddress) external onlyOwner {
        gameController = IGameController(controllerAddress);
    }

    /**
     *  Set fee receiver
     */
    function setFeeReceiver(address newFeeReceiver) external onlyOwner {
        require(newFeeReceiver != address(0), "setFeeReceiver: null address");
        feeReceiver = newFeeReceiver;
    }

    /**
     * Ticket
     */
    event TicketBought(address player, uint256 numTicket, uint256 price);

    function getTicketPrice() external view returns (uint256) {
        return ticketPrice;
    }

    function setTicketPrice(uint256 newTicketPrice) external onlyOwner {
        require(newTicketPrice > 0, "setTicketPrice: Price must be at least 1 wei");
        ticketPrice = newTicketPrice;
    }

    function buyTicket(uint256 numTicket) external {
        require(numTicket > 0, "buyTicket: Number of ticket to buy must be greater than 0");

        uint256 price = numTicket * ticketPrice;
        bool transfered = IERC20(howl).transferFrom(msg.sender, feeReceiver, price);
        require(transfered, "buyTicket: Failed to transfer");

        gameController.setTicket(msg.sender, numTicket);
        emit TicketBought(msg.sender, numTicket, price);
    }

    /**
     *  Store
     */
    mapping(uint256 => uint256) public storePrice;
    mapping(uint256 => uint256) public availableQuantity;

    event QuantitySet(uint256 itemId, uint256 quantity);

    function setItemQuantity(uint256 itemId, uint256 quantity) external onlyOwner {
        availableQuantity[itemId] = quantity;

        emit QuantitySet(itemId, quantity);
    }

    function setStorePrice(uint256 itemId, uint256 newStorePrice) external onlyOwner {
        storePrice[itemId] = newStorePrice;
    }

    function buyGameItem(string memory uri, uint256 itemId) external {
        require(availableQuantity[itemId] > 0, "buyGameItem: this item is not available");

        bool transfered = IERC20(howl).transferFrom(msg.sender, feeReceiver, storePrice[itemId]);
        require(transfered, "buyGameItem: Failed to transfer fee");

        IGameItem(gameitem).storeCreateGameItem(msg.sender, uri, itemId, 3);

        availableQuantity[itemId]--;
    }
}
