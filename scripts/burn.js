const { ethers } = require('hardhat')

const contractAbi =
    require('../artifacts/contracts/HOWL.sol/HOWL.json').abi

const burn = async () => {
    const howl = new ethers.Contract(
        '0x4a22686f57e12ff10ba1bf02c93898c4702f002a',
        contractAbi,
        await ethers.getSigner()
    )

    let res = await howl.burn(ethers.utils.parseEther('40000000'))
    res = await res.wait()
}

burn()
