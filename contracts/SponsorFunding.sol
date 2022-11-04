// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

import "contracts/CrowdFunding.sol";

contract SponsorFunding is Ownable {
    address private _campaign;
    uint256 private _rateDividend;
    uint256 private _rateDivisor;

    constructor(
        address campaign,
        uint256 rateDividend,
        uint256 rateDivisor
    ) payable {
        _campaign = campaign;
        _rateDividend = rateDividend;
        _rateDivisor = rateDivisor;
        CrowdFunding(payable(_campaign)).registerSponsor(this);
    }

    function onPreFinanced() public payable {
        require(msg.sender == _campaign, "Not authorized.");
        CrowdFunding crowdFunding = CrowdFunding(payable(_campaign));

        require(
            _campaign.balance >= crowdFunding.goal(),
            "Goal has not yet been reached."
        );

        uint256 toPay = (crowdFunding.goal() * _rateDividend) / _rateDivisor;
        require(toPay <= address(this).balance, "Insuficient funds.");

        (bool sent, ) = payable(_campaign).call{value: toPay}("");
        require(sent, "Failed transaction.");
    }
}
