const deploy = async () => {
    const MyNFT = await ethers.getContractFactory('MyNFT')
    
    const myNFT = await MyNFT.deploy()
    console.log('Contract deploy to a address:', myNFT.address)
} 

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
