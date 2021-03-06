const { ethers ,network} = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync(`${network.name}_address.json`))
    const GameItem = await ethers.getContractFactory('GameItem')
    const nft = await GameItem.deploy()
    await nft.deployed()

    obj.nftAddress = nft.address
    fs.writeFileSync(`${network.name}_address.json`, JSON.stringify(obj))

    console.log('Contract deploy to a address:', nft.address)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
