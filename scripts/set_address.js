const { ethers, upgrades, network } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let {
        tokenAddress,
        nftAddress,
        marketAddress,
        controllerAddress,
        storeAddress
    } = JSON.parse(fs.readFileSync(`${network.name}_address.json`))

    const signer = await ethers.getSigner()

    const GameItem = new ethers.Contract(
        nftAddress,
        require('../artifacts/contracts/GameItem.sol/GameItem.json').abi,
        signer
    )
    const set1 = await GameItem.setStore(storeAddress)
    await set1.wait()

    const GameController = new ethers.Contract(
        controllerAddress,
        require('../artifacts/contracts/GameController.sol/GameController.json').abi,
        signer
    )
    const set2 = await GameController.setStore(storeAddress)
    await set2.wait()

    const Store = new ethers.Contract(
        storeAddress,
        require('../artifacts/contracts/Store.sol/Store.json').abi,
        signer
    )
    const set3 = await Store.setGameController(controllerAddress)
    await set3.wait()

    console.log('done')
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
