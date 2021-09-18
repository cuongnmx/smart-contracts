const { ethers } = require('hardhat')

const contractAbi =
    require('../artifacts/contracts/NftItem.sol/NftItem.json').abi

const mint = async (player) => {
    const nftItem = new ethers.Contract(
        //contract.address,
        //'0xa45C56f1276E620da5388745F1cB60FD8c3178dD',
        '0xaBc456D94DD16036Ea9C36722350e5fcF1E35cAd',
        contractAbi,
        await ethers.getSigner()
    )

    console.log(player)
    let res = await nftItem.awardItem(
        player,
        'https://gateway.pinata.cloud/ipfs/QmcgTcKV5EC9BNw4rv3iSRPyuzgJ2qQxLnWoo67gk3okUk'
    )
    res = await res.wait()

    const tokenID = res.events[0].args[2]
    //console.log(await nftItem.ownerOf(tokenID))
    console.log(await nftItem.tokenURI(tokenID))
}

//mint('0xccD6CB5034C15C63761070433cE436F5C4636501')
mint('0x446ef7E94bD3Ed4c4ae31795659Ff643f47bb746')
