// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard, IERC721Receiver, Initializable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    Counters.Counter private _saleIds;
    Counters.Counter private _saleSold;
    Counters.Counter private _saleInactive;

    address payable owner;
    IERC20 howl;
    IERC721 nft;
    uint256 listingPrice = 0 ether;

    function initialize(address erc20, address erc721) external initializer {
        owner = payable(msg.sender);
        howl = IERC20(erc20);
        nft = IERC721(erc721);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external pure override returns (bytes4) {
        return 0x150b7a02;
    }

    struct Sale {
        uint256 saleId;
        uint256 tokenId;
        address seller;
        address buyer;
        uint256 price;
        bool isSold;
        bool isActive;
        uint256 lastUpdated;
    }

    mapping(uint256 => Sale) private Sales;

    event SaleCreated(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price, bool isSold);
    event SaleUpdated(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event SaleCanceled(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event TokenSold(uint indexed saleId, uint256 indexed tokenId, address seller, uint256 price, bool isSold);

    modifier onlySeller(uint256 saleId) {
        require(msg.sender == Sales[saleId].seller, "Invalid sale seller");
        _;
    }

    /* Returns the listing price of the contract */
    function getListingPrice() external view returns (uint256) {
        return listingPrice;
    }

    function changeListingPrice(uint256 newListingPrice) external {
        require(newListingPrice > 0, "Price must be at least 1 wei");
        listingPrice = newListingPrice;
    }
  
    /* Places an item for sale on the marketplace */
    function createSale(uint256 tokenId, uint256 price) external payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _saleIds.increment();
        uint256 saleId = _saleIds.current();

        Sales[saleId] = Sale(
            saleId,
            tokenId,
            msg.sender,
            address(0),
            price,
            false,
            true,
            block.timestamp
        );

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit SaleCreated(
            saleId,
            tokenId,
            msg.sender,
            price,
            false
        );
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function buyToken(uint256 saleId, uint256 price) external nonReentrant {
        Sale storage sale = Sales[saleId];
        require((sale.isActive == true) && (sale.isSold == false), "Sale was ended.");
        require(msg.sender != sale.seller, "Buyer is seller of this item.");
        require(price == sale.price, "Please submit the asking price in order to complete the purchase.");

        uint256 tokenId = sale.tokenId;
        howl.safeTransferFrom(msg.sender, sale.seller, price);
        nft.transferFrom(address(this), msg.sender, tokenId);

        sale.isSold = true;
        sale.isActive = false;
        sale.buyer = msg.sender;

        _saleSold.increment();

        emit TokenSold(
            saleId,
            tokenId,
            sale.seller,
            price,
            sale.isSold
        );
    }

    function changePrice(uint256 saleId, uint256 newPrice) external onlySeller(saleId) {
        Sale storage sale = Sales[saleId];
        require(sale.isActive == true, "Sale was ended.");
        require(newPrice > 0, "Price must be at least 1 wei");

        sale.price = newPrice;
        
        emit SaleUpdated(
            saleId,
            sale.tokenId,
            sale.seller,
            sale.price
        );
    }

    function cancelSale(uint256 saleId) external nonReentrant onlySeller(saleId) {
        Sale storage sale = Sales[saleId];
        require(sale.isActive == true, "Sale was ended.");

        nft.transferFrom(address(this), msg.sender, sale.tokenId);
        sale.isActive = false;

        _saleInactive.increment();

        emit SaleCanceled(
            saleId,
            sale.tokenId,
            sale.seller,
            sale.price
        );
    }

    /* Returns all active sales */
    function getActiveSales() external view returns (Sale[] memory) {
        uint256 saleCount = _saleIds.current();
        uint256 activeSaleCount = saleCount - _saleInactive.current();

        uint256 currentIndex = 0;
        Sale[] memory sales = new Sale[](activeSaleCount);
        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].isActive) {
                Sale storage sale = Sales[i];
                sales[currentIndex++] = sale;
            }
        }

        return sales;
    }

    /* Returns all inactive sales */
    function getInactiveSales() external view returns (Sale[] memory) {
        uint256 inactiveSaleCount = _saleInactive.current();

        uint256 currentIndex = 0;
        Sale[] memory sales = new Sale[](inactiveSaleCount);
        for (uint256 i = 1; i <= _saleIds.current(); i++) {
            if (!Sales[i].isActive) {
                Sale storage sale = Sales[i];
                sales[currentIndex++] = sale;
            }
        }

        return sales;
    }

    /* Returns only sales that a user has purchased */
    function getUserPurchasedSales() external view returns (Sale[] memory) {
        uint256 saleCount = _saleIds.current();
        uint256 count = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].buyer == msg.sender) {
                count += 1;
            }
        }

        Sale[] memory sales = new Sale[](count);
        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].buyer == msg.sender) {
                Sale storage sale = Sales[i];
                sales[currentIndex++] = sale;
            }
        }

        return sales;
    }

    /* Returns only sales that a user has created */
    function getUserCreatedSales() external view returns (Sale[] memory) {
        uint256 saleCount = _saleIds.current();
        uint256 count = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].seller == msg.sender) {
                count += 1;
            }
        }

        Sale[] memory sales = new Sale[](count);
        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].seller == msg.sender) {
                Sale storage sale = Sales[i];
                sales[currentIndex++] = sale;
            }
        }

        return sales;
    }
}
