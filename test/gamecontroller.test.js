const { expect } = require('chai')
const { ethers } = require('hardhat')

describe.skip('GameController', () => {
    let GameController, GameItem, signers
    const gameControllerAbi =
        require('../artifacts/contracts/GameController.sol/GameController.json').abi
    const gameItemAbi =
        require('../artifacts/contracts/GameItem.sol/GameItem.json').abi

    before(async () => {
        signers = await ethers.getSigners()

        const gameControllerFactory = await ethers.getContractFactory(
            'GameController'
        )
        GameController = await gameControllerFactory.deploy()
        await GameController.deployed()
        GameController = new ethers.Contract(
            GameController.address,
            gameControllerAbi,
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

        for (let i = 0; i < 10; i++) {
            let res = await GameItem.mintNFT(
                signers[1].address,
                'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
            )
            res = await res.wait()
        }

        GameController.initialize(GameItem.address)
    })

    describe('Username', () => {
        it('Should return username', async () => {
            controller = new ethers.Contract(
                GameController.address,
                gameControllerAbi,
                signers[1]
            )

            const res = await controller.getUsername()
            expect("").to.equal(res)
        })

        it('Should change username', async () => {
            controller = new ethers.Contract(
                GameController.address,
                gameControllerAbi,
                signers[1]
            )

            let res = await controller.setUsername('new user name')
            await res.wait()
            res = await controller.getUsername()

            expect('new user name').to.equal(res)
        })
    })

    describe('NFT', () => {
        it('Should return NFT info', async () => {
            controller = new ethers.Contract(
                GameController.address,
                gameControllerAbi,
                signers[1]
            )

            let res = await controller.getUserNFT()
            expect(10).to.equal(res.length)
            expect(res[3].tokenId).to.equal(ethers.BigNumber.from('4'))
            expect(res[3].contractAddress).to.equal('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512')
            expect(res[3].URI).to.equal('https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk')
        })
    })
})
