const { ethers } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync('deployed_address.json'))
    const marketplaceAbi =
        require('../artifacts/contracts/Marketplace.sol/Marketplace.json').abi

    market = new ethers.Contract(
        obj.marketAddress,
        marketplaceAbi,
        await ethers.getSigner()
    )

    await market.initialize(obj.tokenAddress, obj.nftAddress)

    console.log('done')
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
