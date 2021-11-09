const { ethers, upgrades, network } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync(`${network.name}_address.json`))

    const MasterChef = await ethers.getContractFactory('MasterChef')
    const chef = await upgrades.deployProxy(MasterChef, {
        kind: 'uups',
        initializer: false,
    })
    await chef.deployed()

    const signer = await ethers.getSigner()
    const blockNumber = await signer.provider.getBlockNumber()
    await chef.initialize(
        obj.tokenAddress,
        signer.address,
        ethers.utils.parseEther('0.5708'),
        blockNumber
    )

    obj.masterChefAddress = chef.address
    fs.writeFileSync(`${network.name}_address.json`, JSON.stringify(obj))
    console.log('Contract deploy to a address:', chef.address)
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

