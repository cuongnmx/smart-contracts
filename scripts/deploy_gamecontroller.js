const { ethers } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync('deployed_address.json'))
    const controllerAbi =
        require('../artifacts/contracts/GameController.sol/GameController.json').abi

    const GameControllerFactory = await ethers.getContractFactory('GameController')
    let controller = await GameControllerFactory.deploy()
    await controller.deployed()
    console.log('Contract deploy to a address:', controller.address)

    controller = new ethers.Contract(
        controller.address,
        controllerAbi,
        await ethers.getSigner()
    )

    await controller.initialize(obj.nftAddress)
    console.log('done')
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
