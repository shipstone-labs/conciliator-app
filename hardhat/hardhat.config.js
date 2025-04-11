require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')

require('dotenv').config() // Load environment variables from .env

module.exports = {
  solidity: '0.8.20', // Specify the Solidity compiler version
  optimize: {
    enabled: true,
    runs: 200,
  },
  networks: {
    // Local Hardhat network (default for testing)
    hardhat: {},

    // Filecoin Hyperspace testnet
    hyperspace: {
      url: 'https://filecoin-calibration.chainup.net/rpc/v1', // RPC endpoint for Hyperspace
      chainId: 314159, // Filecoin Hyperspace network chain ID
      accounts: [process.env.PRIVATE_KEY], // Use your wallet private key from .env
    },

    // Ethereum Mainnet (optional)
    mainnet: {
      url:
        process.env.MAINNET_RPC_URL ||
        'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY],
    },

    // Ethereum Goerli testnet (optional)
    goerli: {
      url:
        process.env.GOERLI_RPC_URL ||
        'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
      chainId: 5,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    customChains: [
      {
        network: 'hyperspace',
        chainId: 314159,
        urls: {
          apiURL: 'https://calibration.filfox.info/api', // API endpoint for Filfox Calibration Explorer
          browserURL: 'https://calibration.filfox.info', // Explorer URL
        },
      },
    ],
    apiKey: {
      hyperspace: process.env.HYPERSPACE_KEY, // For verifying contracts (supports Filecoin block explorers if applicable)
    },
  },
}
