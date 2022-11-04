// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "contracts/DistributeFunding.sol";
import "contracts/SponsorFunding.sol";

contract CrowdFunding is Ownable {
    enum Stages {
        NOT_FINANCED,
        PRE_FINANCED,
        FINANCED
    }

    uint256 public goal;
    Stages public currentStage = Stages.NOT_FINANCED;
    mapping(address => uint256) private contributors;

    DistributeFunding public distributor;
    SponsorFunding[] private sponsors;

    event newContribution(address, uint256);
    event newWithdrawal(address, uint256);
    event newMilestoneReached(Stages stage);

    constructor(uint256 fundingGoal, uint256 totalShares) {
        goal = fundingGoal;
        distributor = new DistributeFunding(totalShares);
    }

    function contribute() public payable {
        require(currentStage == Stages.NOT_FINANCED, "The campaign is over.");

        // Update the record with the new donation.
        emit newContribution(msg.sender, msg.value);
        contributors[msg.sender] += msg.value;

        // Update the `currentStage` if needed.
        if (address(this).balance >= goal) {
            currentStage = Stages.PRE_FINANCED;
            emit newMilestoneReached(currentStage);
            __notifySponsors();
        }
    }

    function withdraw(uint256 amount) public {
        require(
            currentStage == Stages.NOT_FINANCED,
            "Withdrawing is no longer possible."
        );

        // Ensure the sender has previously donated at least the requested withdrawal amount.
        require(
            contributors[msg.sender] >= amount,
            createInsuficientFundsErrorMsg(amount, contributors[msg.sender])
        );

        // Repay the requested amount.
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to withdraw.");

        // Update the record accordingly.
        emit newWithdrawal(msg.sender, amount);
        contributors[msg.sender] -= amount;
    }

    function distribute() public onlyOwner {
        require(
            currentStage == Stages.PRE_FINANCED,
            "The campaign is not over yet."
        );

        currentStage = Stages.FINANCED;
        emit newMilestoneReached(currentStage);

        (bool sent, ) = payable(address(distributor)).call{
            value: address(this).balance
        }("");
        require(sent, "Failed to transfer funds to distributor.");
    }

    function addShareholder(address dst, uint256 qty) public onlyOwner {
        distributor.addShareholder(dst, qty);
    }

    function registerSponsor(SponsorFunding sponsor) public {
        sponsors.push(sponsor);
    }

    function __notifySponsors() private {
        for (uint256 idx = 0; idx < sponsors.length; idx++) {
            sponsors[idx].onPreFinanced();
        }
    }

    function createInsuficientFundsErrorMsg(
        uint256 amount,
        uint256 contribution
    ) private pure returns (string memory) {
        string
            memory errmsg = "Amount must be lesser or equal to the total contribution: ";
        string.concat(errmsg, Strings.toString(amount));
        string.concat(errmsg, " > ");
        string.concat(errmsg, Strings.toString(contribution));
        return errmsg;
    }
}
