const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

describe.skip('Marketplace', () => {
    before('set up', async () => {
        this.signers = await ethers.getSigners()
        this.HowlToken = await ethers.getContractFactory('HOWL')
        this.GameItem = await ethers.getContractFactory('GameItem')
        this.Marketplace = await ethers.getContractFactory('Marketplace')
        this.gameItemAbi =
            require('../artifacts/contracts/GameItem.sol/GameItem.json').abi
        this.howlTokenAbi =
            require('../artifacts/contracts/HOWL.sol/HOWL.json').abi
        this.marketplaceAbi =
            require('../artifacts/contracts/Marketplace.sol/Marketplace.json').abi
    })

    it('proxy deploy ', async () => {
        const gameItemDeploy = await this.GameItem.deploy()
        await gameItemDeploy.deployed()

        const howlDeploy = await this.HowlToken.deploy()
        await howlDeploy.deployed()

        this.Marketplace = await upgrades.deployProxy(this.Marketplace, {
            kind: 'uups',
            initializer: false
        })
        await this.Marketplace.deployed()
        await this.Marketplace.initialize(
            howlDeploy.address,
            gameItemDeploy.address
        )

        this.HowlToken = new ethers.Contract(
            howlDeploy.address,
            this.howlTokenAbi,
            this.signers[0]
        )

        this.GameItem = new ethers.Contract(
            gameItemDeploy.address,
            this.gameItemAbi,
            this.signers[0]
        )

        /**
         *  Must setMarket for onlyMarket modifier to work
         */
        const set = await this.GameItem.setMarket(this.Marketplace.address)
        await set.wait()
    })

    it('mint token', async () => {
        const minted = await this.HowlToken.mint(
            this.signers[1].address,
            ethers.utils.parseEther('540000000')
        )
        await minted.wait()
        
        const balance = await this.HowlToken.balanceOf(this.signers[1].address)
        //console.log(ethers.utils.formatEther(balance))
    })

    it('fee percent', async () => {
        const fee = await this.Marketplace.feePercentX10()
        expect(fee.toNumber()).to.equal(10)

        await this.Marketplace.setFee(20)
        const newFee = await this.Marketplace.feePercentX10()
        expect(newFee.toNumber()).to.equal(20)
    })

    it('fee receiver', async () => {
        const receiver = await this.Marketplace.feeReceiver()
        expect(receiver).to.equal(this.signers[0].address)

        await this.Marketplace.setFeeReceiver(this.signers[3].address)
        const newReceiver = await this.Marketplace.feeReceiver()
        expect(newReceiver).to.equal(this.signers[3].address)
    })

    it('get and set item quantity on store', async () => {
        const set = await this.Marketplace.setItemQuantity(1, 1000)

        const one = await this.Marketplace.availableQuantity(1)
        console.log(one.toNumber())
    })

    it('buy nft', async () => {
        const player = this.signers[1]
        const quantity = [1,2,3,4,5,6,7,8,9,10]

        const token = new ethers.Contract(
            this.HowlToken.address,
            this.howlTokenAbi,
            player
        )

        const unlimitedAllowance =
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        await token.approve(this.Marketplace.address, unlimitedAllowance)

        const store = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            player
        )

        for (let i = 0; i < 10; i++) {
            let bought = await store.buyGameItem('uri', 1)
            await bought.wait()
        }

        let totalSupply = await this.GameItem.totalSupply()
        let numToken = await this.GameItem.balanceOf(player.address)
        //expect(numToken.toNumber()).to.equal(1)
        let info = await this.GameItem.gameItems(1)
        //console.log(info)

        const one = await this.Marketplace.availableQuantity(1)
        //console.log(one.toNumber())
    })

    it('should return list of user GameItem', async () => {
        const signer = this.signers[1]
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi, this.signers[1])
        const nfts = await market.getUserNFTs()
        expect(nfts[0].tokenId).to.equal(ethers.BigNumber.from('1'))
        expect(nfts[1].tokenId).to.equal(ethers.BigNumber.from('2'))
    })

    it('should return true #approveAddress()', async () => {
        const signer = this.signers[1]
        const gameitem = new ethers.Contract(
            this.GameItem.address,
            this.gameItemAbi,
            signer
        )
        let approval = await gameitem.approveAddress(this.Marketplace.address)
        approval = await approval.wait()
        expect(true).to.equal(
            await gameitem.isApprovedForAll(
                signer.address,
                this.Marketplace.address
            )
        )
    })

    it('should list items on market, the market is the owner of listed items', async () => {
        const signer = this.signers[1]

        const gameitem = new ethers.Contract(
            this.GameItem.address,
            this.gameItemAbi,
            signer
        )
        let approval = await gameitem.approveAddress(this.Marketplace.address)
        approval = await approval.wait()

        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            signer
        )
        
        for (let i = 1; i <= 10; i++) {
            let res = await market.createSale(i, ethers.utils.parseEther('3000'))
            res = await res.wait()
            expect(await this.GameItem.ownerOf(i)).to.equal(this.Marketplace.address)
        }

        //res = await market.createSale(2, ethers.utils.parseEther('3000'))
        //res = await res.wait()
        //expect(await this.GameItem.ownerOf(2)).to.equal(this.Marketplace.address)
    })

    it('should return a list of user created sales', async () => {
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            this.signers[1]
        )
        const res = await market.getUserCreatedSales()
        //console.log(res)
        expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
        expect(res[1].tokenId).to.equal(ethers.BigNumber.from('2'))
    })

    it('should return a list of active sales', async () => {
        //const provider = new ethers.providers.JsonRpcProvider()
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            //provider
            this.signers[0]
        )

        const res = await market.getActiveSales()
        expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
        expect(res[0].isActive).to.equal(true)
        expect(res[1].tokenId).to.equal(ethers.BigNumber.from('2'))
        expect(res[1].isActive).to.equal(true)
    })

    it.skip('should return a list of active sales by page', async () => {
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            this.signers[0]
        )

        for (let i = 0; i < 10; i++) {
            const res = await market.getActiveSalesByPage(i, 8)
            console.log(res)
        }
    })

    it('Should cancel a sale', async () => {
        const signer = this.signers[1]

        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            signer
        )

        const gameitem = new ethers.Contract(
            this.GameItem.address,
            this.gameItemAbi,
            signer
        )

        let res = await market.cancelSale(2)
        await res.wait()

        expect(await gameitem.ownerOf(2)).to.equal(signer.address)
    })

    it('Should change price of a sale to 1000', async () => {
        const signer = this.signers[1]
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            signer
        )

        let res = await market.changeSalePrice(
            1,
            ethers.utils.parseEther('1000')
        )
        res = await res.wait()
        const newPrice = ethers.utils.formatEther(res.events[0].args[3])

        expect(newPrice).to.equal('1000.0')
    })

    it('should return 1000000.0 HWL token of player 2', async () => {
        const res = await this.HowlToken.transfer(
            this.signers[2].address,
            ethers.utils.parseEther('1000000')
        )
        const balance = await this.HowlToken.balanceOf(this.signers[2].address)
        expect('1000000.0').to.equal(ethers.utils.formatEther(balance))
    })

    it('should successfully buy a token', async () => {
        const seller = this.signers[1].address
        const buyer = this.signers[2]
        const feeReceiver = this.signers[3].address

        const gameitem = new ethers.Contract(
            this.GameItem.address,
            this.gameItemAbi,
            buyer
        )

        const howl = new ethers.Contract(
            this.HowlToken.address,
            this.howlTokenAbi,
            buyer
        )

        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            buyer
        )

        const unlimitedAllowance =
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        await howl.approve(market.address, unlimitedAllowance)

        let res = await market.purchaseSale(1)
        await res.wait()

        const numItem = await market.getUserNFTs()
        const itemInfo = await gameitem.gameItems(numItem[0].tokenId)

    })

    it('should return a list of purchased sales', async () => {
        const market = new ethers.Contract(
            this.Marketplace.address,
            this.marketplaceAbi,
            this.signers[2]
        )

        const res = await market.getUserPurchasedSales()
        let time = res[0].lastUpdated

        expect(res[0].tokenId).to.equal(ethers.BigNumber.from('1'))
    })
})
