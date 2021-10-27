// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGameItem {
    function marketCreateGameItem(address user, string memory uri, uint256 itemId, uint8 star) external;
    function getGameItem(uint256 tokenId) external view returns (uint256, uint256);
}
