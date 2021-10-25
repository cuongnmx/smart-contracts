const { ethers, upgrades } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync('deployed_address.json'))

    const GameControllerFactory = await ethers.getContractFactory('GameController')
    let controller = await upgrades.deployProxy(GameControllerFactory, {
        kind: 'uups',
        initializer: false
    })
    await controller.deployed()
    await controller.initialize(obj.tokenAddress, obj.nftAddress)
    console.log('Contract deploy to a address:', controller.address)
    obj.controllerAddress = controller.address
    fs.writeFileSync('deployed_address.json', JSON.stringify(obj))
    console.log('done')
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
