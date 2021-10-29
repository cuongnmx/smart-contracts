#!/bin/sh

 npx hardhat run scripts/deploy_howltoken.js --network bsc_testnet
 npx hardhat run scripts/deploy_nft.js --network bsc_testnet
 npx hardhat run scripts/deploy_marketplace.js --network bsc_testnet
 npx hardhat run scripts/deploy_gamecontroller.js --network bsc_testnet
 npx hardhat run scripts/deploy_store.js --network bsc_testnet
 npx hardhat run scripts/set_address.js --network bsc_testnet
 npx hardhat approve --network bsc_testnet
