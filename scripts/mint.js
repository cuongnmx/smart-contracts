const { ethers } = require('hardhat')

const contractAbi =
    require('../artifacts/contracts/NftItem.sol/NftItem.json').abi

const mint = async (player) => {
    const nftItem = new ethers.Contract(
        //contract.address,
        '0xa45C56f1276E620da5388745F1cB60FD8c3178dD',
        contractAbi,
        await ethers.getSigner()
    )

    //const player = '0x9d6835a231473Ee95cF95742b236C1EA40814460'
    console.log(player)
    let res = await nftItem.awardItem(
        player,
        'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
    )
    res = await res.wait()

    const tokenID = res.events[0].args[2]
    console.log(await nftItem.ownerOf(tokenID))
    console.log(await nftItem.tokenURI(tokenID))
}
mint('0xF529267c10f919A7294f24BDa8549F941521476E')

const view = async () => {
    const nftItem = new ethers.Contract(
        //contract.address,
        '0xa45C56f1276E620da5388745F1cB60FD8c3178dD',
        contractAbi,
        await ethers.getSigner()
    )
    console.log(await nftItem.ownerOf(1))
    console.log(await nftItem.tokenURI(1))
}
//view()
