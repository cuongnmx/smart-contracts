const { task, types } = require('hardhat/config')

task('accounts', 'Prints the list of accounts').setAction(async (args, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

task('balance', "Prints an account's balance")
    .addParam('account', "The account's address", undefined, types.string)
    .setAction(async (args, hre) => {
        const balance = await hre.ethers.provider.getBalance(args.account)
        console.log(hre.ethers.utils.formatEther(balance), 'ETH')
    })

task('mint', 'Mint NFT')
    .addOptionalParam('token', 'TokenID', 1, types.int)
    .setAction(async (args, hre) => {
        console.log('mint')
    })

task('deploy', 'Deploy contracts')
    .addParam('contract', 'Name of contract', undefined, types.string)
    .setAction(async (args, hre) => {
        const Contract = await hre.ethers.getContractFactory(args.contract)
        const contract = await Contract.deploy()
        await contract.deployed()

        console.log('Contract deploy to: ', contract.address)
    })

module.exports = {}
