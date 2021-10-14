// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

//interface Token {
//    function allowance(address owner, address spender) external view returns (uint256);
//    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) external; 
//}

interface NFT {
    function balanceOf(address owner) external view returns (uint256 balance);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
    function tokenByIndex(uint256 index) external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract MarketplaceV1 is 
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IERC721Receiver {

    using Counters for Counters.Counter;
    //using SafeERC20 for IERC20;

    Counters.Counter private _saleIds;
    Counters.Counter private _saleSold;
    Counters.Counter private _saleInactive;

    uint256 listingPrice;
    address feeReceiver;
    IERC20 howl;
    NFT nft;

    function initialize(address erc20, address erc721) external initializer {
        __Ownable_init();

        howl = IERC20(erc20);
        nft = NFT(erc721);
        listingPrice = 10;
        feeReceiver = msg.sender;

        //console.log(address(howl));
        //console.log(erc721);
        //console.log(msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external pure override returns (bytes4) {
        return 0x150b7a02;
    }

    function getListingPrice() external view returns (uint256) {
        return listingPrice;
    }

    function setListingPrice(uint256 newListingPrice) external onlyOwner {
        require(newListingPrice > 0, "Price must be at least 1 wei");
        listingPrice = newListingPrice;
    }

    function getFeeReceiver() external view returns (address) {
        return feeReceiver;
    }

    function setFeeReceiver(address newFeeReceiver) external onlyOwner {
        feeReceiver = newFeeReceiver;
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

    event SaleCreated(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price, bool isSold, uint256 lastUpdated);
    event SaleUpdated(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price, uint256 lastUpdated);
    event SaleCanceled(uint indexed saleId, uint256 indexed tokenId, address indexed seller, uint256 price, uint256 lastUpdated);
    event SaleSold(uint indexed saleId, uint256 indexed tokenId, address seller, uint256 price, bool isSold, uint256 lastUpdated);

    modifier onlySeller(uint256 saleId) {
        require(msg.sender == Sales[saleId].seller, "Invalid sale seller");
        _;
    }

    /* Places an item for sale on the marketplace */
    function createSale(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(nft.ownerOf(tokenId) == msg.sender, "You do not own this token");

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
            false,
            block.timestamp
        );
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function purchaseSale(uint256 saleId, uint256 price) external nonReentrant {
        uint256 allowance = howl.allowance(msg.sender, address(this));
        require(allowance >= price, "Not enough allowance");

        Sale storage sale = Sales[saleId];
        require((sale.isActive == true) && (sale.isSold == false), "Sale was ended.");
        require(msg.sender != sale.seller, "Buyer is seller of this item.");
        require(price == sale.price, "Please submit the asking price in order to complete the purchase.");

        bool success = howl.transferFrom(msg.sender, sale.seller, price);
        require(success, "Fail to transfer token");

        uint256 tokenId = sale.tokenId;
        nft.transferFrom(address(this), msg.sender, tokenId);

        sale.isSold = true;
        sale.isActive = false;
        sale.buyer = msg.sender;

        _saleSold.increment();

        emit SaleSold(
            saleId,
            tokenId,
            sale.seller,
            price,
            sale.isSold,
            block.timestamp
        );
    }

    function changeSalePrice(uint256 saleId, uint256 newPrice) external onlySeller(saleId) {
        Sale storage sale = Sales[saleId];
        require(sale.isActive == true, "Sale was ended.");
        require(newPrice > 0, "Price must be at least 1 wei");

        sale.price = newPrice;
        
        emit SaleUpdated(
            saleId,
            sale.tokenId,
            sale.seller,
            sale.price,
            block.timestamp
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
            sale.price,
            block.timestamp
        );
    }

    /* Returns all active sales */
    function getActiveSales() external view returns (Sale[] memory) {
        uint256 saleCount = _saleIds.current();
        uint256 activeSaleCount = saleCount - _saleInactive.current() - _saleSold.current();

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

    struct TokenInfo {
        uint256 tokenId;
        address contractAddress;
        string URI;
    }

    function getUserNFTs() external view returns (TokenInfo[] memory) {
        uint256 balance = nft.balanceOf(msg.sender);

        TokenInfo[] memory tokens = new TokenInfo[](balance);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(msg.sender, i);
            string memory uri = nft.tokenURI(tokenId);
            
            tokens[i] = TokenInfo(
                tokenId, address(nft), uri
            );
        }

        return tokens;
    }
}
