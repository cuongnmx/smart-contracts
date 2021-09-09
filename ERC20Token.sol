// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ERC20.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract ERC20Token is ERC20, UniswapV2Router02 {
    address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address internal constant KOVAN_WETH_ADDRESS = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;

    constructor(uint256 totalSupply, string memory name, string memory symbol) 
        public
        ERC20(name, symbol) 
        UniswapV2Router02(UNISWAP_ROUTER_ADDRESS, KOVAN_WETH_ADDRESS) {
        _mint(msg.sender, totalSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
