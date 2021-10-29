const { ethers, upgrades, network } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync(`${network.name}_address.json`))

    const Store = await ethers.getContractFactory('Store')
    const store = await upgrades.deployProxy(Store, {
        kind: 'uups',
        initializer: false,
    })
    await store.deployed()
    await store.initialize(obj.tokenAddress, obj.nftAddress)

    obj.storeAddress = store.address
    fs.writeFileSync(`${network.name}_address.json`, JSON.stringify(obj))
    console.log('Contract deploy to a address:', store.address)
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

