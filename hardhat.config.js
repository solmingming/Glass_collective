require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1
      },
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["evm.bytecode", "evm.deployedBytecode", "abi"]
        }
      },
      metadata: {
        bytecodeHash: "none"
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // 하드햇 노드 기본 주소
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};