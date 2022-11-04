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

  it("Should be able to withdraw stake", async function () {
    const { crowdFunding, distributeFunding } = await loadFixture(
      distributedFundingFixture
    );
    const [_, stakeholder] = await ethers.getSigners();

    await crowdFunding.addShareholder(
      stakeholder.address,
      100 /* the whole amount */
    );

    await crowdFunding.contribute({ value: GOAL });

    await crowdFunding.distribute();

    // Expect the contract to have no ether.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Expect distribute funding contract to have a balance equal to the goal.
    balance = await ethers.provider.getBalance(distributeFunding.address);
    expect(balance).to.equal(GOAL);

    // Expect the shareholder to succesfully withdraw everything.
    await expect(
      distributeFunding.connect(stakeholder).withdraw(GOAL)
    ).to.changeEtherBalance(stakeholder, GOAL);
  });

  it("Should be able to withdraw partial stake", async function () {
    const { crowdFunding, distributeFunding } = await loadFixture(
      distributedFundingFixture
    );
    const [_, stakeholder] = await ethers.getSigners();

    await crowdFunding.addShareholder(
      stakeholder.address,
      100 /* the whole amount */
    );

    await crowdFunding.contribute({ value: GOAL });

    await crowdFunding.distribute();

    // Expect the contract to have no ether.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Expect distribute funding contract to have a balance equal to the goal.
    balance = await ethers.provider.getBalance(distributeFunding.address);
    expect(balance).to.equal(GOAL);

    // Expect the shareholder to succesfully withdraw 50 eth.
    const FIFTY = ethers.utils.parseEther("50.0");
    await expect(
      distributeFunding.connect(stakeholder).withdraw(FIFTY)
    ).to.changeEtherBalance(stakeholder, FIFTY);
  });

  it("Multiple stakeholders should be able to withdraw", async function () {
    const { crowdFunding, distributeFunding } = await loadFixture(
      distributedFundingFixture
    );
    const [_, stakeholder1, stakeholder2] = await ethers.getSigners();

    await crowdFunding.addShareholder(
      stakeholder1.address,
      50 /* the whole amount */
    );

    await crowdFunding.addShareholder(
      stakeholder2.address,
      50 /* the whole amount */
    );

    await crowdFunding.contribute({ value: GOAL });

    await crowdFunding.distribute();

    // Expect the contract to have no ether.
    let balance = await ethers.provider.getBalance(crowdFunding.address);
    expect(balance).to.equal(ZERO);

    // Expect distribute funding contract to have a balance equal to the goal.
    balance = await ethers.provider.getBalance(distributeFunding.address);
    expect(balance).to.equal(GOAL);

    // Expect both shareholders to succesfully withdraw 50 eth.
    const FIFTY = ethers.utils.parseEther("50.0");

    await expect(
      distributeFunding.connect(stakeholder1).withdraw(FIFTY)
    ).to.changeEtherBalance(stakeholder1, FIFTY);

    await expect(
      distributeFunding.connect(stakeholder2).withdraw(FIFTY)
    ).to.changeEtherBalance(stakeholder2, FIFTY);
  });
});
