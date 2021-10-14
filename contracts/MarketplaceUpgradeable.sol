// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "hardhat/console.sol";

contract MarketplaceUUPSV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 _num;

    function initialize() external initializer {
        __Ownable_init();

        _num = 10;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }

    function test() external view returns (uint256) {
        return _num;
    }

    function version() external pure virtual returns (string memory) {
        return "MarketplaceUUPSV1";
    }
}

contract MarketplaceUUPSV2 is MarketplaceUUPSV1 {
    uint256 _numv2;

    function version() external pure virtual override returns (string memory) {
        return "MarketplaceUUPSV2";
    }
}

contract MarketplaceUUPSV2a is MarketplaceUUPSV1 {
    uint256 _numv2; // must be included
    string _strv2a;

    function version() external pure virtual override returns (string memory) {
        return "MarketplaceUUPSV2a";
    }
}

contract MarketplaceUUPSV3 is MarketplaceUUPSV2 {
    string _strv3;

    function version() external pure virtual override returns (string memory) {
        return "MarketplaceUUPSV3";
    }
}
