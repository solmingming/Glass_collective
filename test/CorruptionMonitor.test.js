const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CorruptionMonitor", function () {
  let corruptionMonitor;

  beforeEach(async function () {
    const CorruptionMonitor = await ethers.getContractFactory("CorruptionMonitor");
    corruptionMonitor = await CorruptionMonitor.deploy();
  });

  it("metrics를 업데이트하면 getCorruptionIndex가 올바른 값을 반환해야 한다", async function () {
    await corruptionMonitor.updateMetrics(1, 2, 3, 4, 5, 6);
    const expected = 1*2 + 2*3 + 3*2 + 4*4 + 5*1 + 6*3;
    expect(await corruptionMonitor.getCorruptionIndex()).to.equal(expected);
  });
});