const ethers = require('ethers')
const contractAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json').abi

const mint = async () => {
    const providerUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545'
    const privateKey = '320189e1f5eff1946ccd749d6c8b2e4b83934e785fc063265cf7b0ffa47ef32d'
    const contractAddress = '0x3063dbd11aF88a207F81e949f9dA03057F6e4557'
    const numTokenToMint = '100000000'

    const provider = new ethers.providers.JsonRpcProvider(providerUrl)
    const signer = new ethers.Wallet(privateKey, provider)

    const howl = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
    )

    try {
        const res = await howl.mint(
            signer.address,
            ethers.utils.parseEther(numTokenToMint)
        )
        await res.wait()
    } catch (err) {
        console.log(err.message)
    }

    const balance = await howl.balanceOf(signer.address)
    console.log('Balance: ', ethers.utils.formatEther(balance))
}

mint()
