const { ethers } = require('hardhat')

const deploy = async () => {
    const marketplaceAddress = ''

    const HowlToken = await ethers.getContractFactory('HowlToken')

    const token = await HowlToken.deploy(marketplaceAddress)
    console.log('Contract deploy to a address:', token.address)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
