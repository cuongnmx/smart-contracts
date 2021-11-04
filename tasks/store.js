const { task, types } = require('hardhat/config')
const {formatEther} = require('../utils')

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
        const storeAbi = require('../artifacts/contracts/Store.sol/Store.json')
        const { storeAddress } = require(`../${hre.network.name}_address.json`)

        const store = new ethers.Contract(
            storeAddress,
            storeAbi.abi,
            await ethers.getSigner()
        )

        const res = await store.setItemQuantity(args.id, args.quantity)
        await res.wait()

        const quant = await store.availableQuantity(args.id)
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
        const storeAbi = require('../artifacts/contracts/Store.sol/Store.json')
        const { storeAddress } = require(`../${hre.network.name}_address.json`)

        const store = new ethers.Contract(
            storeAddress,
            storeAbi.abi,
            await ethers.getSigner()
        )

        //const test = ethers.utils.parseEther(args.price)
        const res = await store.setStorePrice(args.id, ethers.utils.parseEther(args.price))
        await res.wait()

        const price = await store.storePrice(args.id)
        console.log(args.id, formatEther(price))
    })

module.export = {}
