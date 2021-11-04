const ethers = require('ethers')

exports.formatEther = (bigNumber) => ethers.utils.formatEther(bigNumber)

exports.parseEther = (string) => ethers.utils.parseEther(string)
