const { ethers } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    const Marketplace = await ethers.getContractFactory('Marketplace')
    const market = await Marketplace.deploy()

    let json = { marketAddress: market.address }
    fs.writeFileSync('deployed_address.json', JSON.stringify(json))
    console.log('Contract deploy to a address:', market.address)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
