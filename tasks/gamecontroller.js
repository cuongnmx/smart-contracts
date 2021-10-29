const { task, types } = require('hardhat/config')

task('reward', 'Game reward').setAction(async (args, hre) => {
    const controllerAbi = require('../artifacts/contracts/GameController.sol/GameController.json')
    const tokenAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json')
    const {
        controllerAddress,
        tokenAddress
    } = require(`../${hre.network.name}_address.json`)
    
    const signer = await ethers.getSigner()

    const howl = new ethers.Contract(
        tokenAddress,
        tokenAbi.abi,
        signer
    )

    const allowance = await howl.allowance(signer.address, controllerAddress)
    if (allowance.eq(ethers.BigNumber.from('0'))) {
        console.log('allow')
        const unlimitedAllowance =
            '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        let approval = await howl.approve(controllerAddress, unlimitedAllowance)
        await approval.wait()
    }

    const gameController = new ethers.Contract(
        controllerAddress,
        controllerAbi.abi,
        signer
    )

    const players = [
        '0x91A736439Cb6339bA892fE70Bb5146A54e21044B',
        '0x446ef7E94bD3Ed4c4ae31795659Ff643f47bb746',
    ]

    const rewarded = await gameController.rewardPvP(players)
    await rewarded.wait()
    console.log('done')
})

module.export = {}
