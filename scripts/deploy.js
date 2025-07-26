const { ethers } = require("hardhat");

async function main() {
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.deployed();
  console.log("Vault deployed to:", vault.address);

  // Proposal, Voting, CorruptionMonitor 순으로 배포
}

main().catch(console.error);