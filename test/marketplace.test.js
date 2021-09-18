const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Marketplace', () => {
    let marketplace, gameItem, Marketplace, GameItem
    const marketplaceAbi =
        require('../artifacts/contracts/Marketplace.sol/Marketplace.json').abi
    const gameItemAbi =
        require('../artifacts/contracts/GameItem.sol/GameItem.json').abi

    before(async () => {
        const marketplaceFactory = await ethers.getContractFactory(
            'Marketplace'
        )
        Marketplace = await marketplaceFactory.deploy()
        await Marketplace.deployed()
        marketplace = new ethers.Contract(
            Marketplace.address,
            marketplaceAbi,
            await ethers.getSigner()
        )

        const gameItemFactory = await ethers.getContractFactory('GameItem')
        GameItem = await gameItemFactory.deploy()
        await GameItem.deployed()
        gameItem = new ethers.Contract(
            GameItem.address,
            gameItemAbi,
            await ethers.getSigner()
        )
    })

    describe('GameItem', () => {
        it('Should mint an NFT item', async () => {
            const player = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
            //const player = (await ethers.getSigner()).address
            //console.log(player)
            let res = await gameItem.awardItem(
                player,
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            res = await res.wait()
            const tokenId = res.events[0].args[2]
            const uri = await gameItem.tokenURI(tokenId)
            const owner = await gameItem.ownerOf(tokenId)
            console.log(`tokenId: ${tokenId}, owner: ${owner}, uri: ${uri}`)
        })
    })

    describe('Market', () => {
        it('Should return 1 as listing price', async () => {
            const listingPrice = await marketplace.getListingPrice()
            expect(1, listingPrice)
        })

        it('Should return true for approveMarket()', async () => {
            const signer = (await ethers.getSigners())[1]
            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                signer
            )
            let approval = await gameitem.approveMarket(true)
            approval = await approval.wait()
            //console.log(approval)
            expect(
                true,
                await gameitem.isApprovedForAll(
                    signer.address,
                    marketplace.address
                )
            )

            approval = await gameitem.approveMarket(false)
            approval = await approval.wait()
            expect(
                false,
                await gameitem.isApprovedForAll(
                    signer.address,
                    marketplace.address
                )
            )
        })

        it('Should list an item on market, the market is the owner of listed item', async () => {
            const tokenId = 1
            const signer = (await ethers.getSigners())[1]

            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                signer
            )
            let approval = await gameitem.approveMarket(true)
            approval = await approval.wait()

            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signer
            )
            let res = await market.listItem(gameItem.address, tokenId, 3000, {
                value: 1
            })
            res = await res.wait()
            //console.log(res)
            expect(await gameItem.ownerOf(tokenId), await marketplace.address)
        })
    })
})
