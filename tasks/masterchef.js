const { task, subtask, types } = require('hardhat/config')
const { formatEther } = require('../utils')
const fs = require('fs')

const masterChefAbi = require('../artifacts/contracts/MasterChef.sol/MasterChef.json')

const poolInfoLog = (poolInfo) => {
    const info = {
        lpToken: poolInfo.lpToken,
        allocPoint: poolInfo.allocPoint.toNumber(),
        lastRewardBlock: poolInfo.lastRewardBlock.toNumber(),
        accHowlPerShare: poolInfo.accHowlPerShare.toNumber()
    }
    console.log(info)
}

const userInfoLog = (userInfo, pending) => {
    const info = {
        amount: formatEther(userInfo.amount),
        rewardDebt: formatEther(userInfo.rewardDebt),
        pendingReward: formatEther(pending)
    }
    console.log(info)
}

task('add-pool', 'Add pool').setAction(async (args, hre) => {
    const { masterChefAddress } = require(`../${hre.network.name}_address.json`)
    const masterchef = new ethers.Contract(
        masterChefAddress,
        masterChefAbi.abi,
        await ethers.getSigner()
    )

    const lpTokenAddress = '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4'

    const lpTokenPool = await masterchef.add(1000, lpTokenAddress, false)
    await lpTokenPool.wait()

    console.log('done')
})

task('pool-info').setAction(async (args, hre) => {
    const { masterChefAddress } = require(`../${hre.network.name}_address.json`)
    const masterchef = new ethers.Contract(
        masterChefAddress,
        masterChefAbi.abi,
        await ethers.getSigner()
    )

    const hwlPool = await masterchef.poolInfo(0)
    poolInfoLog(hwlPool)

    //const lpTokenPool = await masterchef.poolInfo(1)
    //poolInfoLog(hwlPool)
})

task('user-info').setAction(async (args, hre) => {
    const { masterChefAddress } = require(`../${hre.network.name}_address.json`)
    const masterchef = new ethers.Contract(
        masterChefAddress,
        masterChefAbi.abi,
        await ethers.getSigner()
    )

    //const res = await masterchef.deposit(0, ethers.utils.parseEther('100'))
    //await res.wait()

    const userInfo = await masterchef.userInfo(0, (await ethers.getSigner()).address)
    const pending = await masterchef.pendingHowl(0, (await ethers.getSigner()).address)
    userInfoLog(userInfo, pending)
})
