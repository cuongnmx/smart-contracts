const { task, types } = require('hardhat/config')

task('set-quantity', 'Set item quantity on store')
    .addParam(
        'quantity',
        'quantity',
        undefined,
        types.int
    )
    .addParam(
        'id',
        'itemId on store',
        undefined,
        types.int
    )
    .setAction(async (args, hre) => {
        const contractAbi = require('../artifacts/contracts/Marketplace.sol/Marketplace.json')
        const { marketAddress } = require(`../${hre.network.name}_address.json`)

        const market = new ethers.Contract(
            marketAddress,
            contractAbi.abi,
            await ethers.getSigner()
        )

        const res = await market.setItemQuantity(args.id, args.quantity)
        await res.wait()

        const quant = await market.availableQuantity(args.id)
        console.log(args.id, quant.toNumber())
    })

task('set-price', 'Set item price on store')
    .addParam(
        'price',
        'price',
        undefined,
        types.string
    )
    .addParam(
        'id',
        'itemId on store',
        undefined,
        types.int
    )
    .setAction(async (args, hre) => {
        const contractAbi = require('../artifacts/contracts/Marketplace.sol/Marketplace.json')
        const { marketAddress } = require(`../${hre.network.name}_address.json`)

        const market = new ethers.Contract(
            marketAddress,
            contractAbi.abi,
            await ethers.getSigner()
        )

        //const test = ethers.utils.parseEther(args.price)
        const res = await market.setStorePrice(args.id, ethers.utils.parseEther(args.price))
        await res.wait()

        const price = await market.storePrice(args.id)
        console.log(args.id, ethers.utils.formatEther(price))
    })

module.export = {}
