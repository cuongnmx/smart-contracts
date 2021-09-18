
const { ethers } = require('hardhat')

const contractAbi =
    require('../artifacts/contracts/NftItem.sol/NftItem.json').abi

const view = async () => {
    const nftItem = new ethers.Contract(
        //contract.address,
        //'0xa45C56f1276E620da5388745F1cB60FD8c3178dD',
        '0xaBc456D94DD16036Ea9C36722350e5fcF1E35cAd',
        contractAbi,
        await ethers.getSigner()
    )

    //console.log(await nftItem.ownerOf(1))
    //console.log(await nftItem.tokenURI(1))
    const numToken = await nftItem.balanceOf('0xccD6CB5034C15C63761070433cE436F5C4636501') // 2
    // array cua token id [1, 6]
    for (let i = 0; i < numToken; i++) {
        const token_id = await nftItem.tokenOfOwnerByIndex('0xccD6CB5034C15C63761070433cE436F5C4636501', i)
        console.log(token_id)
        const uri = await nftItem.tokenURI(token_id)
        console.log(uri)
    }
    //console.log(await nftItem.tokenByIndex(1))
}

view()
