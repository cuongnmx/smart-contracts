/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')

require('./tasks')

module.exports = {
    solidity: '0.8.0',
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {},
        howl_rinkeby: {
            url: process.env.HOWL_RINKEBY_API_URL,
            accounts: [`0x${process.env.HOWL_PRIVATE_KEY}`]
        },
        bsc_testnet: {
            url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
            chainId: 97,
            gasPrice: 20000000000,
            accounts: [`0x${process.env.HOWL_PRIVATE_KEY}`]
        },
        bsc_mainnet: {
            url: 'https://bsc-dataseed.binance.org/',
            chainId: 56,
            gasPrice: 20000000000,
            accounts: [`0x${process.env.HOWL_PRIVATE_KEY}`]
        }
    },
    mocha: {
        timeout: 20000
    }
}
