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
    .addOptionalParam('quantity', 'Number of NFT to be minted', 1, types.int)
    .addOptionalParam(
        'address',
        "The account's address",
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        types.string
    )
    .setAction(async (args, hre) => {
        const contractAbi = require('../artifacts/contracts/GameItem.sol/GameItem.json')
        const { nftAddress } = require('../deployed_address.json')

        const gameItem = new ethers.Contract(
            nftAddress,
            contractAbi.abi,
            await ethers.getSigner()
        )

        for (let i = 0; i < args.quantity; i++) {
            let res = await gameItem.mintNFT(
                args.address,
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            res = await res.wait()
        }
        console.log('minted')

        const balance = await gameItem.balanceOf(args.address)
        console.log(`NFT owned: ${balance.toString()}`)
    })

module.exports = {}
