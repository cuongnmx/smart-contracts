const { ethers, upgrades, network } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync(`${network.name}_address.json`))

    const Marketplace = await ethers.getContractFactory('Marketplace')
    const market = await upgrades.deployProxy(Marketplace, {
        kind: 'uups',
        initializer: false,
    })
    await market.deployed()
    await market.initialize(obj.tokenAddress, obj.nftAddress)

    obj.marketAddress = market.address
    fs.writeFileSync(`${network.name}_address.json`, JSON.stringify(obj))
    console.log('Contract deploy to a address:', market.address)
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

