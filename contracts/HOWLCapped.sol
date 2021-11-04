// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HOWLCapped is ERC20, ERC20Burnable, Pausable, Ownable {
    uint256 private immutable _cap;

    constructor() ERC20("HOWL", "HWL") {
        _cap = 540000000 * 10 ** decimals();
    }

    function cap() public view virtual returns (uint256) {
        return _cap;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _mint(address account, uint256 amount) internal override {
        require(ERC20.totalSupply() + amount <= cap(), "ERC20: cap exceeded");
        super._mint(account, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
