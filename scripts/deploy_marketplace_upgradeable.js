const { ethers, upgrades } = require('hardhat')

const main = async () => {
    const MarketplaceV1 = await ethers.getContractFactory('MarketplaceV1')
    const market = await upgrades.deployProxy(MarketplaceV1)

    await market.deployed()
    console.log('MyCollectible deployed to:', market.address)
}

main()
