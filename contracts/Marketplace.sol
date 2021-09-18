// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard, IERC721Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 1;

    constructor() {
        owner = payable(msg.sender);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external pure override returns (bytes4) {
        return 0x150b7a02;
    }

    struct ListingItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => ListingItem) private ListingItems;

    event ListingItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    /* Returns the listing price of the contract */
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }
  
    /* Places an item for sale on the marketplace */
    function listItem(address nftContract, uint256 tokenId, uint256 price) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        ListingItems[itemId] = ListingItem(
            itemId,
            nftContract,
            tokenId,
            //payable(seller),
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        //console.log(IERC721(nftContract).getApproved(tokenId));
        //console.log(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)));
        //console.log(msg.sender);

        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        emit ListingItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            //seller,
            address(0),
            price,
            false
        );
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function createSale(address nftContract, uint256 itemId) public payable nonReentrant {
        uint256 price = ListingItems[itemId].price;
        uint256 tokenId = ListingItems[itemId].tokenId;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        ListingItems[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        ListingItems[itemId].owner = payable(msg.sender);
        ListingItems[itemId].sold = true;

        _itemsSold.increment();

        payable(owner).transfer(listingPrice);

        // emit ItemSold();
    }

    /* Returns all unsold market items */
    function fetchListingItems() public view returns (ListingItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = itemCount - _itemsSold.current();

        uint256 currentIndex = 0;
        ListingItem[] memory items = new ListingItem[](unsoldItemCount);
        for (uint256 i = 1; i <= itemCount; i++) {
            if (ListingItems[i].sold == false) {
                ListingItem storage currentItem = ListingItems[i];
                items[currentIndex++] = currentItem;
                //currentIndex += 1;
            }
        }
        return items;
    }

    /* Returns onlyl items that a user has purchased */
    function fetchMyNFTs() public view returns (ListingItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (ListingItems[i].owner == msg.sender) {
                itemCount += 1;
            }
        }

        ListingItem[] memory items = new ListingItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (ListingItems[i].owner == msg.sender) {
                ListingItem storage currentItem = ListingItems[i];
                items[currentIndex++] = currentItem;
                //currentIndex += 1;
            }
        }
        return items;
    }

    /* Returns only items a user has created */
    function fetchItemCreated() public view returns (ListingItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (ListingItems[i].seller == msg.sender) {
                itemCount += 1;
            }
        }

        ListingItem[] memory items = new ListingItem[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (ListingItems[i].seller == msg.sender) {
                ListingItem storage currentItem = ListingItems[i];
                items[currentIndex++] = currentItem;
                //currentIndex += 1;
            }
        }
        return items;
    }
}
