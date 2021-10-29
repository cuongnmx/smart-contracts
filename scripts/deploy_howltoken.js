const { ethers, network} = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    const HowlToken = await ethers.getContractFactory('HOWL')
    const token = await HowlToken.deploy()
    await token.deployed()

    let obj = JSON.parse(fs.readFileSync(`${network.name}_address.json`))
    obj.tokenAddress = token.address
    fs.writeFileSync(`${network.name}_address.json`, JSON.stringify(obj))

    console.log('Contract deploy to a address:', token.address)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
