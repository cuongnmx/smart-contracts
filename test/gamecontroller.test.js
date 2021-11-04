const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const gameControllerAbi =
    require('../artifacts/contracts/GameController.sol/GameController.json').abi
const nftAbi = require('../artifacts/contracts/GameItem.sol/GameItem.json').abi
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

        const nftFactory = await ethers.getContractFactory('GameItem')
        this.NFT = await nftFactory.deploy()
        await this.NFT.deployed()
        this.NFT = new ethers.Contract(
            this.NFT.address,
            nftAbi,
            this.signers[0]
        )

        this.GameController.initialize(this.howl.address, this.NFT.address)
    })

    it('mint nft to contract owner', async () => {
        const quantity = Array.from(Array(10).keys())
        const res = await Promise.all(
            quantity.map(async (it) => {
                let res = await this.NFT.createGameItem(
                    this.signers[1].address,
                    'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk',
                    1,
                    3
                )
                res = await res.wait()
                return 'done'
            })
        )
    })

    it('mint token to contract owner', async () => {
        const res = await this.howl.balanceOf(this.signers[0].address)
        //console.log(ethers.utils.formatEther(res))
        expect(ethers.utils.formatEther(res)).to.equal('540000000.0')
    })

    describe('Game Master', () => {
        it('should change ticket price', async () => {
            const price = await this.GameController.ticketPrice()
            //console.log(ethers.utils.formatEther(price))
            expect(ethers.utils.formatEther(price)).to.equal('10.0')

            const changed = await this.GameController.setTicketPrice(
                ethers.utils.parseEther('20')
            )
            const newPrice = await this.GameController.ticketPrice()
            expect(ethers.utils.formatEther(newPrice)).to.equal('20.0')

            const changed2 = await this.GameController.setTicketPrice(ethers.utils.parseEther('10'))
            const newPrice2 = await this.GameController.ticketPrice()
            expect(ethers.utils.formatEther(newPrice2)).to.equal('10.0')
        })

        it('should change prize percent', async () => {
            const changed = await this.GameController.setPrizePercent(2, [100, 0])
            await changed.wait()

            const percent = await this.GameController.prizePercentX10(2, 0)
            console.log(percent.toNumber())
        })

        it('should change point', async () => {
            const changed = await this.GameController.setPoint(2, [10000, 20000])
            await changed.wait()

            const point = await this.GameController.points(2, 0)
            console.log(point.toNumber())
        })

        it('should change game master', async () => {
            const gm = await this.GameController.gameMaster()
            expect(gm).to.equal(this.signers[0].address)

            const changed = await this.GameController.setGameMaster(
                this.signers[2].address
            )
            const newGm = await this.GameController.gameMaster()
            expect(newGm).to.equal(this.signers[2].address)
        })
    })

    describe('Player', () => {
        it('Should return player info', async () => {
            controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            const player = await controller.players(this.signers[1].address)

            expect('').to.equal(player.name)
            expect(ethers.BigNumber.from('0')).to.equal(player.ticket)
            expect(ethers.BigNumber.from('0')).to.equal(player.point)
        })

        it('Should change playername', async () => {
            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            let res = await controller.setPlayerName('new player name')
            await res.wait()

            const player = await controller.players(this.signers[1].address)

            expect('new player name').to.equal(player.name)
        })

        it('Should buy ticket', async () => {
            const unlimitedAllowance =
                '115792089237316195423570985008687907853269984665640564039457584007913129639935'
            let approval = await this.howl.approve(
                this.GameController.address,
                unlimitedAllowance
            )
            appoval = await approval.wait()

            const bought = await this.GameController.buyTicket(10)
            const info = await controller.players(this.signers[0].address)
            expect(info.ticket.toNumber()).to.equal(10)
        })
    })

    describe.skip('Game', () => {
        it.skip('start game', async () => {
            const addresses = []
            for (let i = 1; i < 7; i++) {
                addresses.push(this.signers[i].address)
            }

            const started = await this.GameController.startGame(addresses)
            await started.wait()

            const getgame = await this.GameController.getGame(addresses)
            console.log(getgame)
        })

        it.skip('reward room 2 pvp', async () => {
            const addresses = []
            const len = 3
            for (let i = 1; i < len; i++) {
                addresses.push(this.signers[i].address)
            }

            const rewarded = await this.GameController.rewardPvP(addresses)
            await rewarded.wait()
            
            for (let i = 0; i < len - 1; i++) {
                let balance = await this.howl.balanceOf(addresses[i])
                console.log(ethers.utils.formatEther(balance))

                const controller = new ethers.Contract(
                    this.GameController.address,
                    gameControllerAbi,
                    this.signers[i + 1]
                )
                let info = await controller.getPlayerInfo()
                console.log(info.point.toNumber())
            }
        })

        it.skip('reward room 3 pvp', async () => {
            const addresses = []
            const len = 4
            for (let i = 1; i < len; i++) {
                addresses.push(this.signers[i].address)
            }

            const rewarded = await this.GameController.rewardPvP(addresses)
            await rewarded.wait()
            
            for (let i = 0; i < len - 1; i++) {
                let balance = await this.howl.balanceOf(addresses[i])
                console.log(ethers.utils.formatEther(balance))

                const controller = new ethers.Contract(
                    this.GameController.address,
                    gameControllerAbi,
                    this.signers[i + 1]
                )
                let info = await controller.getPlayerInfo()
                console.log(info.point.toNumber())
            }
        })

        it.skip('reward room 4 pvp', async () => {
            const addresses = []
            const len = 5
            for (let i = 1; i < len; i++) {
                addresses.push(this.signers[i].address)
            }

            const rewarded = await this.GameController.rewardPvP(addresses)
            await rewarded.wait()
            
            for (let i = 0; i < len - 1; i++) {
                let balance = await this.howl.balanceOf(addresses[i])
                console.log(ethers.utils.formatEther(balance))

                const controller = new ethers.Contract(
                    this.GameController.address,
                    gameControllerAbi,
                    this.signers[i + 1]
                )
                let info = await controller.getPlayerInfo()
                console.log(info.point.toNumber())
            }
        })

        it.skip('reward room 5 pvp', async () => {
            const addresses = []
            const len = 6
            for (let i = 1; i < len; i++) {
                addresses.push(this.signers[i].address)
            }

            const rewarded = await this.GameController.rewardPvP(addresses)
            await rewarded.wait()
            
            for (let i = 0; i < len - 1; i++) {
                let balance = await this.howl.balanceOf(addresses[i])
                console.log(ethers.utils.formatEther(balance))

                const controller = new ethers.Contract(
                    this.GameController.address,
                    gameControllerAbi,
                    this.signers[i + 1]
                )
                let info = await controller.getPlayerInfo()
                console.log(info.point.toNumber())
            }
        })

        it.skip('reward room 6 pvp', async () => {
            const addresses = []
            const len = 7
            for (let i = 1; i < len; i++) {
                addresses.push(this.signers[i].address)
            }

            const rewarded = await this.GameController.rewardPvP(addresses)
            await rewarded.wait()
            
            for (let i = 0; i < len - 1; i++) {
                let balance = await this.howl.balanceOf(addresses[i])
                console.log(ethers.utils.formatEther(balance))

                const controller = new ethers.Contract(
                    this.GameController.address,
                    gameControllerAbi,
                    this.signers[i + 1]
                )
                let info = await controller.getPlayerInfo()
                console.log(info.point.toNumber())
            }
        })

        it('reward pve', async () => {
            const rewarded = await this.GameController.rewardPvE(this.signers[10].address, 1)
            await rewarded.wait()

            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[10]
            )
            const info = await controller.getPlayerInfo()
            console.log(info.point.toNumber())

            const res = await this.howl.balanceOf(this.signers[10].address)
            console.log(ethers.utils.formatEther(res))
        })
    })

    describe('Game item', () => {
        it('Should return game item info', async () => {
            const controller = new ethers.Contract(
                this.GameController.address,
                gameControllerAbi,
                this.signers[1]
            )

            let res = await controller.getGameItems(this.signers[1].address)
            for (let it of res) {
                console.log(it.tokenId.toNumber(), it.itemId.toNumber(), it.star.toNumber())
            }
        })
    })
})
