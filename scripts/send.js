const send = async () => {
    require('dotenv').config()

    const { RINKEBY_API_URL, PRIVATE_KEY } = process.env
    const { createAlchemyWeb3 } = require("@alch/alchemy-web3")

    const web3 = createAlchemyWeb3(RINKEBY_API_URL)
    const myAddress = '0x91A736439Cb6339bA892fE70Bb5146A54e21044B'
   
    const nonce = await web3.eth.getTransactionCount(myAddress, 'latest') // nonce starts counting from 0

    const transaction = {
        to: '0xd8b7265a83fcd775d075a20f0208e608ec6d9aca', // faucet address to return eth
        value: web3.utils.toWei('0.05'),
        gas: 25000,
        maxFeePerGas: 1000000108,
        nonce: nonce,
        data: web3.utils.toHex('tra tien netflix di ban')
        // optional data field to send message or execute smart contract
    }
   
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY)
    
    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
        if (!error) {
            console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!")
        } else {
            console.log("❗Something went wrong while submitting your transaction:", error)
        }
    })
}

send()
