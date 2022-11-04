import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("DistributeFunding", function () {
  const GOAL = ethers.utils.parseEther("100.0");
  const ZERO = ethers.utils.parseEther("0.0");
  const SHARES = 100;

  async function distributedFundingFixture() {
    const crowdFunding = await ethers
      .getContractFactory("CrowdFunding")
      .then((contract) => contract.deploy(GOAL, SHARES));
    const distributeFunding = await ethers
      .getContractFactory("DistributeFunding")
      .then(async (contract) =>
        contract.attach(await crowdFunding.distributor())
      );

    return { crowdFunding, distributeFunding };
  }

  it("Should be withdraw stake", async function () {
    const { crowdFunding, distributeFunding } = await loadFixture(
      distributedFundingFixture
    );
    const [_, stakeholder] = await ethers.getSigners();

    await crowdFunding.addShareholder(stakeholder.address, 100);

    await crowdFunding.contribute({ value: GOAL });

    await crowdFunding.distribute();

    // Expect the contract to have no ether.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Expect distribute funding contract to have a balance equal to the goal.
    balance = await ethers.provider.getBalance(distributeFunding.address);
    expect(balance).to.equal(GOAL);

    // TODO: finish implementation
  });
});
