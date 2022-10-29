// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

import "contracts/CrowdFunding.sol";

contract DistributeFunding is Ownable {
    address[] _shareholders;
    mapping(address => uint256) private _shares;
    uint256 private _totalShares;
    uint256 private _reservedShares = 0;
    uint256 private _goal;
    bool private completed = false;

    event newShareholder(address, uint256);

    constructor(uint256 totalShares) {
        _totalShares = totalShares;
    }

    function addShareholder(address dst, uint256 qty) public onlyOwner {
        require(_reservedShares + qty <= _totalShares, "Not enough shares.");

        _shareholders.push(dst);
        _shares[dst] = qty;
        _reservedShares += qty;
    }

    receive() external payable onlyOwner {
        _goal = CrowdFunding(msg.sender).goal();
        completed = true;
        require(msg.value >= _goal, "Invalid state: the goal wasn't reached.");
    }

    fallback() external {
      revert("Not implemented.");
    }

    function withdraw(uint256 amount) public {
        require(completed, "The funding round wasn't yet completed.");

        uint256 stake = (_shares[msg.sender] * _goal) / _totalShares;
        require(stake >= amount, "Insufficient funds.");

        _shares[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to withdraw funds.");
    }
}
