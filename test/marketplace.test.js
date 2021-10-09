const { expect } = require('chai')
const { ethers } = require('hardhat')

describe.skip('Marketplace', () => {
    let Marketplace, GameItem, HowlToken, signers
    const marketplaceAbi =
        require('../artifacts/contracts/Marketplace.sol/Marketplace.json').abi
    const gameItemAbi =
        require('../artifacts/contracts/GameItem.sol/GameItem.json').abi
    const howlTokenAbi =
        require('../artifacts/contracts/HowlToken.sol/HowlToken.json').abi

    before(async () => {
        signers = await ethers.getSigners()

        const marketplaceFactory = await ethers.getContractFactory(
            'Marketplace'
        )
        Marketplace = await marketplaceFactory.deploy()
        await Marketplace.deployed()
        Marketplace = new ethers.Contract(
            Marketplace.address,
            marketplaceAbi,
            await ethers.getSigner()
        )

        const gameItemFactory = await ethers.getContractFactory('GameItem')
        GameItem = await gameItemFactory.deploy()
        await GameItem.deployed()
        GameItem = new ethers.Contract(
            GameItem.address,
            gameItemAbi,
            await ethers.getSigner()
        )

        const HowlTokenFactory = await ethers.getContractFactory('HowlToken')
        HowlToken = await HowlTokenFactory.deploy()
        await HowlToken.deployed()
        HowlToken = new ethers.Contract(
            HowlToken.address,
            howlTokenAbi,
            await ethers.getSigner()
        )

        Marketplace.initialize(HowlToken.address, GameItem.address)
    })

    describe('HowlToken', () => {
        it('Should return total supply of 500000000 HWL tokens', async () => {
            const address = (await ethers.getSigner()).address
            const balance = await HowlToken.balanceOf(address)
            expect('500000000.0').to.equal(ethers.utils.formatEther(balance))
        })

        it('Should return 1000000.0 HWL token of player 2', async () => {
            const res = await HowlToken.transfer(
                signers[2].address,
                ethers.utils.parseEther('1000000')
            )
            const balance = await HowlToken.balanceOf(signers[2].address)
            expect('1000000.0').to.equal(ethers.utils.formatEther(balance))
        })
    })

    describe('GameItem', () => {
        it('Should mint NFT items', async () => {
            const player = signers[1]

            let res = await GameItem.mintNFT(
                player.address,
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            res = await res.wait()

            res = await GameItem.mintNFT(
                player.address,
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            res = await res.wait()

            let tokenIds = []
            let totalSupply = await GameItem.totalSupply()
            let numToken = await GameItem.balanceOf(player.address)

            for (let index = 0; index < numToken; index++) {
                let tokenId = await GameItem.tokenOfOwnerByIndex(
                    player.address,
                    index
                )
                tokenIds.push(tokenId)
            }

            expect(totalSupply).to.equal(ethers.BigNumber.from('2'))
            expect(await GameItem.tokenURI(tokenIds[0])).to.equal(
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            expect(await GameItem.tokenURI(tokenIds[1])).to.equal(
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            expect(await GameItem.ownerOf(tokenIds[0])).to.equal(player.address)
            expect(await GameItem.ownerOf(tokenIds[1])).to.equal(player.address)
        })
    })

    describe('Market', () => {
        it('Should return list of user NFT', async () => {
            const signer = signers[1]
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signer
            )
            const nfts = await market.getUserNFTs()
            expect(nfts[0].tokenId).to.equal(ethers.BigNumber.from('1'))
            expect(nfts[1].tokenId).to.equal(ethers.BigNumber.from('2'))
        })

        it('Should return 1 as listing price', async () => {
            const listingPrice = await Marketplace.getListingPrice()
            expect(0).to.equal(listingPrice)
        })

        it('Should return true and false for approveAddress()', async () => {
            const signer = signers[1]
            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                signer
            )
            let approval = await gameitem.approveAddress(Marketplace.address)
            approval = await approval.wait()
            expect(true).to.equal(
                await gameitem.isApprovedForAll(
                    signer.address,
                    Marketplace.address
                )
            )
        })

        it('Should list items on market, the market is the owner of listed items', async () => {
            const signer = signers[1]

            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                signer
            )
            let approval = await gameitem.approveAddress(Marketplace.address)
            approval = await approval.wait()

            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signer
            )
            let res = await market.createSale(
                1,
                ethers.utils.parseEther('3000'),
                {
                    value: 0
                }
            )
            res = await res.wait()

            res = await market.createSale(2, ethers.utils.parseEther('3000'))
            res = await res.wait()

            expect(await GameItem.ownerOf(1)).to.equal(
                await Marketplace.address
            )
            expect(await GameItem.ownerOf(2)).to.equal(
                await Marketplace.address
            )
        })

        it('Should return a list of user created sales', async () => {
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signers[1]
            )
        
            const res = await market.getUserCreatedSales()

            expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
            expect(res[1].tokenId).to.equal(ethers.BigNumber.from('2'))
        })

        it('Should return a list of active sales', async () => {
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signers[0]
            )

            const res = await market.getActiveSales()
            expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
            expect(res[1].tokenId).to.equal(ethers.BigNumber.from('2'))
        })

        it('Should cancel a sale', async () => {
            const signer = signers[1]

            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signer
            )

            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                signer
            )

            let res = await market.cancelSale(2)
            await res.wait()

            expect(await gameitem.ownerOf(2)).to.equal(signer.address)
        })

        it('Should return a list of inactive sales', async () => {
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signers[0]
            )

            const res = await market.getInactiveSales()
            expect(res[0].tokenId).to.equal(ethers.BigNumber.from('2'))
        })

        it('Should change price of a sale to 1000', async () => {
            const signer = signers[1]
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signer
            )

            let res = await market.changePrice(
                1,
                ethers.utils.parseEther('1000')
            )
            res = await res.wait()
            const newPrice = ethers.utils.formatEther(res.events[0].args[3])

            expect(newPrice).to.equal('1000.0')
        })

        it('Should successfully buy a token', async () => {
            const buyer = signers[2]

            const gameitem = new ethers.Contract(
                GameItem.address,
                gameItemAbi,
                buyer
            )

            const howl = new ethers.Contract(
                HowlToken.address,
                howlTokenAbi,
                buyer
            )

            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                buyer
            )

            await howl.approve(
                market.address,
                ethers.utils.parseEther('100000')
            )

            let res = await market.buyToken(1, ethers.utils.parseEther('1000'))
            res = await res.wait()

            expect(await GameItem.ownerOf(1)).to.equal(buyer.address)
            expect('1000.0').to.equal(
                ethers.utils.formatEther(
                    await howl.balanceOf(signers[1].address)
                )
            )
            expect('999000.0').to.equal(
                ethers.utils.formatEther(await howl.balanceOf(buyer.address))
            )
        })

        it('Should return a list of purchased sales', async () => {
            const market = new ethers.Contract(
                Marketplace.address,
                marketplaceAbi,
                signers[2]
            )

            const res = await market.getUserPurchasedSales()
            let time = res[0].lastUpdated
            //console.log(time.toNumber())
            
            expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
        })
    })
})
