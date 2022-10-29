import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("CrowdFunding", function () {
  const SHARES = 100;

  const GOAL = ethers.utils.parseEther("100.0");
  const ZERO = ethers.utils.parseEther("0.0");

  async function deployCrowdFunding() {
    const crowdFunding = await ethers
      .getContractFactory("CrowdFunding")
      .then((contract) => contract.deploy(GOAL, SHARES));

    return { crowdFunding };
  }

  it("Should be able to receive donations", async function () {
    const { crowdFunding } = await loadFixture(deployCrowdFunding);
    const [donor] = await ethers.getSigners();

    // Expect the contract to initially be empty.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Donate 10 ether.
    const donationValue = ethers.utils.parseEther("1.0");
    const options = { value: donationValue };
    await expect(crowdFunding.contribute(options))
      .to.emit(crowdFunding, "newContribution")
      .withArgs(donor.address, donationValue);

    // Expect the contract to contain 10 ether.
    balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(donationValue);
  });

  it("Should be able to withdraw donations", async function () {
    const { crowdFunding } = await loadFixture(deployCrowdFunding);
    const [donor] = await ethers.getSigners();

    // Expect the contract to initially be empty.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Donate 10 ether.
    const donationValue = ethers.utils.parseEther("1.0");
    const options = { value: donationValue };
    await expect(crowdFunding.contribute(options))
      .to.emit(crowdFunding, "newContribution")
      .withArgs(donor.address, donationValue);

    // Expect the contract to contain 10 ether.
    balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(donationValue);

    // Withdraw 10 ether.
    await expect(crowdFunding.withdraw(donationValue))
      .to.emit(crowdFunding, "newWithdrawal")
      .withArgs(donor.address, donationValue);

    // Expect the contract to be empty.
    balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);
  });
});
