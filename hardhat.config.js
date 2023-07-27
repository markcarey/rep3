/** @type import('hardhat/config').HardhatUserConfig */
const dot = require('dotenv').config();
//require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
const { ETHERSCAN_API_KEY, OPTISCAN_API_KEY, ARBISCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.19",
  defaultNetwork: "apothem",
  networks: {
    hardhat: {
      accounts: [{ privateKey: `0x${process.env.PRIVATE_KEY}`, balance: "10000000000000000000000"}],
      forking: {
        url: process.env.API_URL_APOTHEM,
        blockNumber: 8717392
      },
      loggingEnabled: true,
      gasMultiplier: 10,
      gasPrice: 1000000000 * 500,
      blockGasLimit: 0x1fffffffffffff
    },
    apothem: {
      url: process.env.API_URL_APOTHEM,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gasMultiplier: 10,
      gasPrice: 1000000000 * 100,
      blockGasLimit: 0x1fffffffffffff
    }
  }
};
