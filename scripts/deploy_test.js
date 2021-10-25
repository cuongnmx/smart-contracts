const { ethers } = require('hardhat')
const fs = require('fs')

const deploy = async () => {
    //const Test = await ethers.getContractFactory('Test')
    //const test = await Test.deploy()
    //await test.deployed()

    //console.log('Contract deploy to a address:', test.address)

    const contract = new ethers.Contract(
        '0x732ce403d49d6479eab878e17959b3eC48249885',
        require('../artifacts/contracts/Test.sol/Test.json').abi,
        await ethers.getSigner()
    )
    const res = await contract.getAddress()
    console.log(res)
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
