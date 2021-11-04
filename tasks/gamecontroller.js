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

    hre.run('erc20-approve-allowance', {contract: howl, address: controllerAddress})

    const gameController = new ethers.Contract(
        controllerAddress,
        controllerAbi.abi,
        signer
    )

    const players = [
        '0x91A736439Cb6339bA892fE70Bb5146A54e21044B',
        '0x446ef7E94bD3Ed4c4ae31795659Ff643f47bb746',
    ]

    const rewarded = await gameController.rewardPvE(players[0], 6)
    await rewarded.wait()
    console.log('done')
})

module.export = {}
