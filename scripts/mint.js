require('dotenv').config()

const { createAlchemyWeb3 } = require('@alch/alchemy-web3')
const web3 = createAlchemyWeb3(process.env.API_URL)

const contract = require('../artifacts/contracts/hwl.sol/MyNFT.json')
const contract_address = '0x50b49fed58eAD9476Ed99D007E9c91112092D264'
const nft_contract = new web3.eth.Contract(contract.abi, contract_address)

const { PUBLIC_KEY, PRIVATE_KEY } = process.env
//console.log(JSON.stringify(contract.abi))
const mint_nft = async (token_uri) => {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest')

    const transaction = {
        nonce: nonce,
        from: PUBLIC_KEY,
        to: contract_address,
        gas: 500000,
        data: nft_contract.methods.mintNFT(PUBLIC_KEY, token_uri).encodeABI()
    }

    const signed_transaction = await web3.eth.accounts.signTransaction(
        transaction,
        PRIVATE_KEY
    )

    web3.eth.sendSignedTransaction(
        signed_transaction.rawTransaction,
        (error, hash) => {
            if (!error) {
                console.log(
                    '🎉 The hash of your transaction is: ',
                    hash,
                    "\n Check Alchemy's Mempool to view the status of your transaction!"
                )
            } else {
                console.log(
                    '❗Something went wrong while submitting your transaction:',
                    error
                )
            }
        }
    )
}

mint_nft('https://gateway.pinata.cloud/ipfs/QmWVbaAcAazYDd2CKvY9gi7RiqYdBxBa6DKvKd7LwChZcx')
