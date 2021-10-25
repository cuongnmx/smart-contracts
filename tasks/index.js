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

        const quantity = Array.from(Array(args.quantity).keys())

        const res = await Promise.all(
            quantity.map(async (_) => {
                let res = await gameItem.mintNFT(
                    args.address,
                    'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
                )
                res = await res.wait()
                return 'done'
            })
        )
        console.log('minted')

        const balance = await gameItem.balanceOf(args.address)
        console.log(`NFT owned: ${balance.toString()}`)
    })

task('approve', 'ERC20 approve')
    .addParam(
        'opt',
        'contract address want to approve',
        undefined,
        types.string
    )
    .setAction(async (args, hre) => {
        const contractAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
        const {
            tokenAddress,
            controllerAddress,
            marketAddress
        } = require('../deployed_address.json')

        const provider = new ethers.providers.JsonRpcProvider(
            'https://data-seed-prebsc-1-s1.binance.org:8545'
        )
        const wallet = new ethers.Wallet(
            '018bfd0213f1615851e3bea353e02bb6be9eac3c964bb9c0b71e06513b921522',
            provider
        )

        const howl = new ethers.Contract(
            tokenAddress,
            contractAbi.abi,
            //await ethers.getSigner()
            wallet
        )

        let address = ''
        if (args.opt === 'market') {
            address = marketAddress
        } else if (args.opt === 'controller') {
            address = controllerAddress
        }

        const unlimitedAllowance =
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        let approval = await howl.approve(address, unlimitedAllowance)
        appoval = await approval.wait()
        console.log('done')
    })

task('reward', 'game reward').setAction(async (args, hre) => {
    const controllerAbi = require('../artifacts/contracts/GameController.sol/GameController.json')
    const tokenAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
    const {
        controllerAddress,
        tokenAddress
    } = require('../deployed_address.json')

    const gameController = new ethers.Contract(
        controllerAddress,
        controllerAbi.abi,
        await ethers.getSigner()
    )

    const players = [
        '0x91A736439Cb6339bA892fE70Bb5146A54e21044B',
        '0x446ef7E94bD3Ed4c4ae31795659Ff643f47bb746',
    ]

    const rewarded = await gameController.rewardPvP(players)
    await rewarded.wait()
    console.log('done')
})

task('view', '').setAction(async (args, hre) => {
    const controllerAbi = require('../artifacts/contracts/GameController.sol/GameController.json')
    const tokenAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
    const {
        controllerAddress,
        tokenAddress
    } = require('../deployed_address.json')

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

    const res = await gameController.getPlayerInfo()
    console.log(res)
    console.log(res.point.toNumber())
})

module.exports = {}
