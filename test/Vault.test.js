const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let vault, owner, treasurer, user;

  beforeEach(async function () {
    [owner, treasurer, user] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(owner.address);
    await vault.grantRole(await vault.TREASURER_ROLE(), treasurer.address);
  });

  it("이더를 입금하고 잔액을 확인할 수 있다", async function () {
    await user.sendTransaction({ to: vault.target, value: ethers.parseEther("2") });
    expect(await vault.getBalance()).to.equal(ethers.parseEther("2"));
  });

  it("treasurer만 출금할 수 있다", async function () {
    await user.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    await expect(
      vault.connect(treasurer).transfer(user.address, ethers.parseEther("1"))
    ).to.changeEtherBalance(user, ethers.parseEther("1"));
  });

  it("잔액이 부족하면 출금이 실패해야 한다", async function () {
    await expect(
      vault.connect(treasurer).transfer(user.address, ethers.parseEther("1"))
    ).to.be.revertedWith("Vault: insufficient balance");
  });
});