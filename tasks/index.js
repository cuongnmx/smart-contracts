const { task, types } = require('hardhat/config')

require('./marketplace.js')
require('./gamecontroller.js')

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
        const { nftAddress } = require(`../${hre.network.name}_address.json`)

        const gameItem = new ethers.Contract(
            nftAddress,
            contractAbi.abi,
            await ethers.getSigner()
        )

        for (let i = 0; i < args.quantity; i++) {
            let res = await gameItem.createGameItem(
                args.address,
                'https://gateway.pinata.cloud/ipfs/QmaiYy8XwWtKZgVVm4LXDgVojPbRz9QodPZM6Tta2fUEDY',
                12,
                3
            )
            await res.wait()
        }

        const balance = await gameItem.balanceOf(args.address)
        console.log(`NFT owned: ${balance.toString()}`)
    })

task('approve', 'ERC20 approve')
    .setAction(async (args, hre) => {
        const tokenAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
        const nftAbi = require('../artifacts/contracts/GameItem.sol/GameItem.json')
        const {
            tokenAddress,
            nftAddress,
            controllerAddress,
            marketAddress
        } = require(`../${hre.network.name}_address.json`)

        const signer = await ethers.getSigner()

        const nft = new ethers.Contract(
            nftAddress,
            nftAbi.abi,
            signer
        )

        const howl = new ethers.Contract(
            tokenAddress,
            tokenAbi.abi,
            signer
        )

        const allowance = await howl.allowance(signer.address, controllerAddress)
        if (allowance.eq(ethers.BigNumber.from('0'))) {
            console.log('token aprove', controllerAddress)
            const unlimitedAllowance =
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
            let approval = await howl.approve(controllerAddress, unlimitedAllowance)
            await approval.wait()
        }
    })

task('view', 'Request data on blockchain').setAction(async (args, hre) => {
    const controllerAbi = require('../artifacts/contracts/GameController.sol/GameController.json')
    const tokenAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
    const marketAbi = require('../artifacts/contracts/Marketplace.sol/Marketplace.json')
    const {
        controllerAddress,
        tokenAddress,
        marketAddress
    } = require(`../${hre.network.name}_address.json`)

    const provider = new ethers.providers.JsonRpcProvider(
        'https://data-seed-prebsc-1-s1.binance.org:8545'
    )
    const wallet = new ethers.Wallet(
        //'018bfd0213f1615851e3bea353e02bb6be9eac3c964bb9c0b71e06513b921522',
        'd19742d8b119815291a91497ef29fdfce5f693a046d04bbd31626f2a42ccae23',
        provider
    )

    const gameController = new ethers.Contract(
        controllerAddress,
        controllerAbi.abi,
        wallet
    )
    
    console.log(wallet.address)

    const player = await gameController.players(wallet.address)
    console.log('player', player)

    const items = await gameController.getGameItems(wallet.address)
    console.log('getgameitems', items)

    const market = new ethers.Contract(
        marketAddress,
        marketAbi.abi,
        wallet
    )

    const price = await market.storePrice()
    console.log(price.toString())
})

module.exports = {}
