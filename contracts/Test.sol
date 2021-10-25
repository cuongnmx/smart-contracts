pragma solidity ^0.8.0;

contract Test {
    uint public total;

    constructor() {
        total = 0;
    }

    function add() external {
        total += 1;
    }

    function getTotal() external view returns (uint) {
        return total;
    }

    function getAddress() external view returns (address) {
        return msg.sender;
    }
}
