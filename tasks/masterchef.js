const { task, subtask, types } = require('hardhat/config')
const { formatEther } = require('../utils')
const fs = require('fs')

task('add-pool', 'Add pool').setAction(async (args, hre) => {
    let {tokenAddress} = JSON.parse(fs.readFileSync(`${hre.network.name}_address.json`))

    const masterChefAbi = require('../artifacts/contracts/MasterChef.sol/MasterChef.json')
    const { masterChefAddress } = require(`../${hre.network.name}_address.json`)

    const masterchef = new ethers.Contract(
        masterChefAddress,
        masterChefAbi.abi,
        await ethers.getSigner()
    )

    const hwlPool = await masterchef.add(1000, tokenAddress, false)
    await hwlPool.wait()

    //const lpTokenPool = await masterchef.add(1000, lpTokenAddress, false)
    //await lpTokenPool.wait()

    console.log('done')
})
