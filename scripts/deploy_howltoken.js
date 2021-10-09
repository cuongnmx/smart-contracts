const { ethers } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    const HowlToken = await ethers.getContractFactory('HowlToken')
    const token = await HowlToken.deploy()
    await token.deployed()

    let obj = JSON.parse(fs.readFileSync('deployed_address.json'))
    obj.tokenAddress = token.address
    fs.writeFileSync('deployed_address.json', JSON.stringify(obj))

    console.log('Contract deploy to a address:', token.address)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
