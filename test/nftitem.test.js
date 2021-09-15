const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('NftItem', () => {
    let nftItem

    before(async () => {
        const contractAbi = require('../artifacts/contracts/NftItem.sol/NftItem.json').abi

        //const ContractFactory = await ethers.getContractFactory('NftItem')
        //const contract = await ContractFactory.deploy()
        //await contract.deployed()

        nftItem = new ethers.Contract(
            //contract.address,
            '0xa45C56f1276E620da5388745F1cB60FD8c3178dD',
            contractAbi,
            await ethers.getSigner()
        )
    })

    it('awardItem', async () => {
        const player = (await ethers.getSigner()).address
        console.log(player)
        let res = await nftItem.awardItem(player, 'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk')
        res = await res.wait()

        const tokenID = res.events[0].args[2]
        console.log(await nftItem.ownerOf(tokenID))
        console.log(await nftItem.tokenURI(tokenID))
    })
})
