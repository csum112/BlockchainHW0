import { AssertionError, expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SponsorFunding", function () {
  const SHARES = 100;

  const GOAL = ethers.utils.parseEther("100.0");
  const ZERO = ethers.utils.parseEther("0.0");

  async function deployCrowdFunding() {
    const crowdFunding = await ethers
      .getContractFactory("CrowdFunding")
      .then((contract) => contract.deploy(GOAL, SHARES));

    return { crowdFunding };
  }

  it("sponsorFunding is done successfully", async function () {
    const { crowdFunding } = await loadFixture(deployCrowdFunding);
    const [donor] = await ethers.getSigners();
    const dividend = 1;
    const divisor = 100;
    const sponsorFunding = await ethers
      .getContractFactory("SponsorFunding")
      .then((contract) =>
        contract.deploy(crowdFunding.address, dividend, divisor, {
          value: ethers.utils.parseEther("50.0"),
        })
      );

    // Expect the crowdFunding contract to initially be empty.
    let crowdFundingBalance = await ethers.provider.getBalance(
      crowdFunding.address
    );
    expect(crowdFundingBalance).to.equal(ZERO);

    // Expect the sponsorFunding contract to initially be 500.
    let sponsorBalance = await ethers.provider.getBalance(
      sponsorFunding.address
    );
    expect(sponsorBalance).to.equal(ethers.utils.parseEther("50.0"));

    // Donate 100 ether.
    const donationValue = ethers.utils.parseEther("100.0");
    const options = { value: donationValue };
    await expect(crowdFunding.contribute(options))
      .to.emit(crowdFunding, "newContribution")
      .withArgs(donor.address, donationValue);

    // Expect the crowdFunding contract to be 1100.
    let crowdFundingBalance2 = await ethers.provider.getBalance(
      crowdFunding.address
    );
    expect(crowdFundingBalance2).to.equal(ethers.utils.parseEther("101.0"));
  });

  it("sponsor has insuficient funds", async function () {
    const { crowdFunding } = await loadFixture(deployCrowdFunding);
    const [donor] = await ethers.getSigners();
    const dividend = 1;
    const divisor = 10;
    const sponsorFunding = await ethers
      .getContractFactory("SponsorFunding")
      .then((contract) =>
        contract.deploy(crowdFunding.address, dividend, divisor, {
          value: ethers.utils.parseEther("1.0"),
        })
      );

    // Expect the crowdFunding contract to initially be empty.
    let crowdFundingBalance = await ethers.provider.getBalance(
      crowdFunding.address
    );
    expect(crowdFundingBalance).to.equal(ZERO);

    // Expect the sponsorFunding contract to initially be 10.
    let sponsorBalance = await ethers.provider.getBalance(
      sponsorFunding.address
    );
    expect(sponsorBalance).to.equal(ethers.utils.parseEther("1.0"));

    // Donate 100 ether.
    const donationValue = ethers.utils.parseEther("100.0");
    const options = { value: donationValue };
    await expect(crowdFunding.contribute(options))
      .to.emit(crowdFunding, "newContribution")
      .withArgs(donor.address, donationValue)
      .to.emit(crowdFunding, "sponsorshipFailed");

    // Expect the crowdFunding contract to be 1000.
    let crowdFundingBalance2 = await ethers.provider.getBalance(
      crowdFunding.address
    );
    expect(crowdFundingBalance2).to.equal(ethers.utils.parseEther("100.0"));
  });

  it("sponsorFunding.onPreFinanced() is called by other entity", async function () {
    const { crowdFunding } = await loadFixture(deployCrowdFunding);
    const [entity] = await ethers.getSigners();
    const dividend = 1;
    const divisor = 100;
    const sponsorFunding = await ethers
      .getContractFactory("SponsorFunding")
      .then((contract) =>
        contract.deploy(crowdFunding.address, dividend, divisor, {
          value: ethers.utils.parseEther("50.0"),
        })
      );

    // Expect the crowdFunding contract to initially be empty.
    let crowdFundingBalance = await ethers.provider.getBalance(
      crowdFunding.address
    );
    expect(crowdFundingBalance).to.equal(ZERO);

    //Expect calling onPrefinanced by other entity to be reverted
    expect(sponsorFunding.connect(entity).onPreFinanced()).to.be.reverted;

    // Expect the sponsorFunding contract to initially be 500.
    let sponsorBalance = await ethers.provider.getBalance(
      sponsorFunding.address
    );
    expect(sponsorBalance).to.equal(ethers.utils.parseEther("50.0"));
  });
});
