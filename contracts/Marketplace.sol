// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Marketplace is 
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IERC721Receiver {

    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _saleIds;
    Counters.Counter private _saleSold;
    Counters.Counter private _saleInactive;

    uint256 private feePercentX10;
    address private feeReceiver;
    IERC20 public howl;
    IERC721 public nft;

    function initialize(address erc20, address erc721) external initializer {
        __Ownable_init();

        howl = IERC20(erc20);
        nft = IERC721(erc721);

        feePercentX10 = 10;
        feeReceiver = msg.sender;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external pure override returns (bytes4) {
        return 0x150b7a02;
    }

    /**
        Fee percent and fee receiver
    */
    function getFee() external view returns (uint256) {
        return feePercentX10;
    }

    function setFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee percent must be smaller than 10%");
        feePercentX10 = newFee;
    }

    function getFeeReceiver() external view returns (address) {
        return feeReceiver;
    }

    function setFeeReceiver(address newFeeReceiver) external onlyOwner {
        require(newFeeReceiver != address(0), "setFeeReceiver: null address");
        feeReceiver = newFeeReceiver;
    }

    /**
        Sale
    */
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
    event FeeTransfered(uint saleId, uint256 tokenId, address seller, address buyer, address feeReceiver, uint256 fee, uint256 lastUpdated);

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

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

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
    function purchaseSale(uint256 saleId) external nonReentrant {
        Sale storage sale = Sales[saleId];
        uint256 price = sale.price;

        uint256 allowance = howl.allowance(msg.sender, address(this));
        require(allowance >= price, "Not enough allowance");
        require((sale.isActive == true) && (sale.isSold == false), "Sale was ended.");
        require(msg.sender != sale.seller, "Buyer is seller of this item.");

        // transfer to fee receiver
        bool feeReceiverTxSuccess = howl.transferFrom(msg.sender, feeReceiver, price.mul(feePercentX10).div(1000));
        require(feeReceiverTxSuccess, "Failed to transfer fee");

        // transfer to seller
        bool sellerTxSuccess = howl.transferFrom(msg.sender, sale.seller, price.mul(1000 - feePercentX10).div(1000));
        require(sellerTxSuccess, "Failed to transfer token");

        uint256 tokenId = sale.tokenId;
        nft.transferFrom(address(this), msg.sender, tokenId);
        uint256 currentTime = block.timestamp;

        sale.isSold = true;
        sale.isActive = false;
        sale.buyer = msg.sender;
        sale.lastUpdated = currentTime;

        _saleSold.increment();

        emit SaleSold(
            saleId,
            tokenId,
            sale.seller,
            price,
            sale.isSold,
            currentTime
        );

        emit FeeTransfered(
            saleId,
            tokenId,
            sale.seller,
            sale.buyer,
            feeReceiver,
            price.mul(feePercentX10).div(1000),
            currentTime
        );
    }

    function changeSalePrice(uint256 saleId, uint256 newPrice) external onlySeller(saleId) {
        Sale storage sale = Sales[saleId];
        require(sale.isActive && !sale.isSold, "Sale was ended.");
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
        require(sale.isActive, "Sale was ended.");

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

    function getActiveSalesByPage(uint page, uint size) external view returns (Sale[] memory) {
        require(page >= 0 && size > 0, "Page and size must be greater than 0");

        uint256 saleCount = _saleIds.current();
        uint256 activeSaleCount = saleCount - _saleInactive.current() - _saleSold.current();
        if (activeSaleCount < page * size) return new Sale[](0);

        uint256 currentIndex = 0;
        uint256 count = 0;

        uint256 saleSize = (page + 1) * size > activeSaleCount ? activeSaleCount - page * size : size;
        Sale[] memory sales = new Sale[](saleSize);
        for (uint256 i = 1; i <= saleCount; i++) {
            if (Sales[i].isActive) {
                count++;
                if (count > page * size) {
                    Sale storage sale = Sales[i];
                    sales[currentIndex] = sale;
                    if (currentIndex++ == size - 1) break;
                }
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
            uint256 tokenId = ERC721Enumerable(address(nft)).tokenOfOwnerByIndex(msg.sender, i);
            string memory uri = ERC721URIStorage(address(nft)).tokenURI(tokenId);
            
            tokens[i] = TokenInfo(
                tokenId, address(nft), uri
            );
        }

        return tokens;
    }
}
