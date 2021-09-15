// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./utils/Ownable.sol";
import "./math/SafeMath.sol";
import "./ERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Howl is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 public maxSupply = 500000000 * 10 ** 18;

    constructor() ERC20("HOWL", "HWL") {
        _mint(_msgSender(), maxSupply);
    }
}
