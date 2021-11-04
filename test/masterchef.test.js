const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

const parseEther = (amount) => ethers.utils.parseEther(amount)
const formatEther = (amount) => ethers.utils.formatEther(amount)

const poolInfoLog = (poolInfo) => {
    const info = {
        lpToken: poolInfo.lpToken,
        allocPoint: poolInfo.allocPoint.toNumber(),
        lastRewardBlock: poolInfo.lastRewardBlock.toNumber(),
        accHowlPerShare: poolInfo.accHowlPerShare.toNumber()
    }
    console.log(info)
}

const userInfoLog = (userInfo) => {
    const info = {
        amount: userInfo.amount.toNumber(),
        rewardDebt: userInfo.rewardDebt.toNumber()
    }
    console.log(info)
}

describe('MasterChef', () => {
    before('set up', async () => {
        this.signers = await ethers.getSigners()
        this.lpToken = await ethers.getContractFactory('HOWL')
        this.HowlToken = await ethers.getContractFactory('HOWLCapped')
        this.MasterChef = await ethers.getContractFactory('MasterChef')
        this.lpTokenAbi =
            require('../artifacts/contracts/HOWL.sol/HOWL.json').abi
        this.howlTokenAbi =
            require('../artifacts/contracts/HOWLCapped.sol/HOWLCapped.json').abi
        this.masterchefAbi =
            require('../artifacts/contracts/MasterChef.sol/MasterChef.json').abi
    })

    it('deploy', async () => {
        const lpDeploy = await this.lpToken.deploy()
        await lpDeploy.deployed()

        this.lpToken = new ethers.Contract(
            lpDeploy.address,
            this.lpTokenAbi,
            this.signers[0]
        )

        const howlDeploy = await this.HowlToken.deploy()
        await howlDeploy.deployed()

        this.HowlToken = new ethers.Contract(
            howlDeploy.address,
            this.howlTokenAbi,
            this.signers[0]
        )

        const blockNumber = await this.signers[0].provider.getBlockNumber()

        const masterchefDeploy = await this.MasterChef.deploy(
            this.HowlToken.address,
            this.signers[7].address,
            parseEther('100'),
            //100,
            blockNumber
        )
        await masterchefDeploy.deployed()

        this.MasterChef = new ethers.Contract(
            masterchefDeploy.address,
            this.masterchefAbi,
            this.signers[0]
        )
    })

    it('distribute lpToken', async () => {
        const mint1 = await this.lpToken.mint(this.signers[1].address, parseEther('1000000'))
        await mint1.wait()

        const mint2 = await this.lpToken.mint(this.signers[2].address, parseEther('1000000'))
        await mint2.wait()

        const mint3 = await this.lpToken.mint(this.signers[3].address, parseEther('1000000'))
        await mint3.wait()
    })

    it('mint token to MasterChef', async () => {
        const minted = await this.HowlToken.mint(
            this.MasterChef.address,
            parseEther('1000000')
        )
        await minted.wait()

        const balance = await this.HowlToken.balanceOf(this.MasterChef.address)
        console.log('HOWL of MasterChef', formatEther(balance))
    })

    it('add staking pool', async () => {
        const pool = await this.MasterChef.add(1000, this.lpToken.address, false)
        await pool.wait()

        const poolLength = await this.MasterChef.poolLength()
        console.log('pool length:', poolLength.toNumber())

        const totalAllocPoint = await this.MasterChef.totalAllocPoint()
        console.log('total alloc point:', totalAllocPoint.toNumber())
    })

    it('info', async () => {
        const lpTokenInfo = await this.MasterChef.poolInfo(1)
        poolInfoLog(lpTokenInfo)

        const userInfo = await this.MasterChef.userInfo(1, this.signers[1].address)
        userInfoLog(userInfo)
    })

    it('deposit', async () => {
        const pool = new ethers.Contract(
            this.lpToken.address,
            this.lpTokenAbi,
            this.signers[1]
        )

        //const deposited = await pool.deposit(0, parseEther('100'))
        //await deposited.wait()
    })
})
