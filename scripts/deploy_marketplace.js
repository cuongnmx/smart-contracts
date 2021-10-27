const { ethers, upgrades } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    let obj = JSON.parse(fs.readFileSync('deployed_address.json'))

    const Marketplace = await ethers.getContractFactory('Marketplace')
    const market = await upgrades.deployProxy(Marketplace, {
        kind: 'uups',
        initializer: false,
    })
    await market.deployed()
    await market.initialize(obj.tokenAddress, obj.nftAddress)

    obj.marketAddress = market.address
    fs.writeFileSync('deployed_address.json', JSON.stringify(obj))
    console.log('Contract deploy to a address:', market.address)

    const GameItem = new ethers.Contract(
        obj.nftAddress,
        require('../artifacts/contracts/GameItem.sol/GameItem.json').abi,
        await ethers.getSigner()
    )
    const set = await GameItem.setMarket(market.address)
    await set.wait()
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

