const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const gameControllerAbi =
    require('../artifacts/contracts/GameController.sol/GameController.json').abi
const nftAbi = require('../artifacts/contracts/NHOWL.sol/NHOWL.json').abi
const howlAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json').abi

describe.skip('GameController', () => {
    before(async () => {
        this.signers = await ethers.getSigners()

        const gameControllerFactory = await ethers.getContractFactory(
            'GameController'
        )
        this.GameController = await upgrades.deployProxy(
            gameControllerFactory,
            {
                kind: 'uups',
                initializer: false
            }
        )
        await this.GameController.deployed()
        this.GameController = new ethers.Contract(
            this.GameController.address,
            gameControllerAbi,
            this.signers[0]
        )

        const howlFactory = await ethers.getContractFactory('HOWL')
        this.howl = await howlFactory.deploy()
        await this.howl.deployed()
        this.howl = new ethers.Contract(
            this.howl.address,
            howlAbi,
            this.signers[0]
        )

        const nftFactory = await ethers.getContractFactory('NHOWL')
        this.NFT = await nftFactory.deploy()
        await this.NFT.deployed()
        this.NFT = new ethers.Contract(
            this.NFT.address,
            nftAbi,
            this.signers[0]
        )

        this.GameController.initialize(this.NFT.address, this.NFT.address)
    })

    it('mint nft to contract owner', async () => {
        const quantity = Array.from(Array(10).keys())
        const res = await Promise.all(
            quantity.map(async (it) => {
                let res = await this.NFT.mint(
                    this.signers[1].address,
                    'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
                )
                res = await res.wait()
                return 'done'
            })
        )
    })

    it('mint token to contract owner', async () => {
        const mint = await this.howl.mint(this.signers[0].address, ethers.utils.parseEther('100000000'))
        await mint.wait()

        const res = await this.howl.balanceOf(this.signers[0].address)
        expect(ethers.utils.formatEther(res)).to.equal('100000000.0')
    })

    describe('Player', () => {
        it('Should return playername', async () => {
            controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            const res = await controller.getPlayerName()
            expect("").to.equal(res)
        })

        it('Should change playername', async () => {
            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            let res = await controller.setPlayerName('new player name')
            await res.wait()
            res = await controller.getPlayerName()

            expect('new player name').to.equal(res)
        })

        it('Should return fuel', async () => {
            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            const res = await controller.getPlayerFuel()
            expect(0).to.equal(res.toNumber())
        })

        it('Should change fuel', async () => {
            const owner = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[0]
            )
            const res = await owner.setPlayerFuel(this.signers[1].address, 10)

            const player = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )
            const fuel = await player.getPlayerFuel()
            expect(10).to.equal(fuel.toNumber())
        })
        
    })

    describe('NFT', () => {
        it('Should return NFT info', async () => {
            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            let res = await controller.getPlayerNFT()
            expect(10).to.equal(res.length)
            expect(res[3].tokenId).to.equal(ethers.BigNumber.from('4'))
            expect(res[3].URI).to.equal('https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk')
        })
    })
})
