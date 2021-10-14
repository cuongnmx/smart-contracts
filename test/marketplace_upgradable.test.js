const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

describe.skip('Marketplace Upgradeable', () => {
    before('get factories', async () => {
        this.MarketplaceV1 = await ethers.getContractFactory(
            'MarketplaceUUPSV1'
        )
        this.MarketplaceV2 = await ethers.getContractFactory(
            'MarketplaceUUPSV2'
        )
    })

    it('proxy deploy and upgrade', async () => {
        const deploy = await upgrades.deployProxy(this.MarketplaceV1, {
            kind: 'uups',
            initializer: 'initialize'
        })
        await deploy.deployed()

        const marketplaceV1 = new ethers.Contract(
            deploy.address,
            require('../artifacts/contracts/MarketplaceUpgradeable.sol/MarketplaceUUPSV1.json').abi,
            await ethers.getSigner()
        )
        expect(await marketplaceV1.version()).to.equal('MarketplaceUUPSV1')

        const deployV2 = await upgrades.upgradeProxy(deploy, this.MarketplaceV2)
        expect(deploy.address).to.equal(deployV2.address)

        const marketplaceV2 = new ethers.Contract(
            deploy.address,
            require('../artifacts/contracts/MarketplaceUpgradeable.sol/MarketplaceUUPSV2.json').abi,
            await ethers.getSigner()
        )

        expect(await marketplaceV2.version()).to.equal('MarketplaceUUPSV2')

        //console.log(await marketplaceV1.test())
        //console.log(await marketplaceV2.test())
    })
})
