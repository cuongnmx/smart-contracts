const { expect } = require('chai')
const { ethers } = require('hardhat')

const deploy = async (contract) => {
    const Contract = await ethers.getContractFactory(contract)
    const _contract = await Contract.deploy()
    await _contract.deployed()
    return _contract.address
}

describe('HOWL', () => {
    let contract, contract_rw, accounts

    before(async () => {
        accounts = await ethers.provider.listAccounts()
        const genericErc20Abi = require('../Erc20Abi.json')
        const address = await deploy('HOWL')

        contract = new ethers.Contract(
            address,
            genericErc20Abi,
            ethers.provider
        )

        contract_rw = new ethers.Contract(
            address,
            genericErc20Abi,
            await ethers.getSigner()
        )
    })

    describe('#constructor()', () => {
        it('Should return total supply of 500000000.0', async () => {
            const totalSupply = ethers.utils.formatEther(
                await contract.totalSupply()
            )
            expect(totalSupply).to.equal('500000000.0')
        })

        it('Should return 500000000.0 tokens of contract deployer', async () => {
            const Contract = await ethers.getContractFactory('HOWL')
            const balance = ethers.utils.formatEther(
                await contract.balanceOf(Contract.signer.address)
            )
            expect(balance).to.equal('500000000.0')
        })

        it("Should return HOWL as token's name", async () => {
            const name = await contract.name()
            expect(name).to.equal('HOWL')
        })

        it("Should return HWL as token's symbol", async () => {
            const symbol = await contract.symbol()
            expect(symbol).to.equal('HWL')
        })
    })

    describe('#transfer()', () => {
        it("Should return 1000.0 as recipient's balance", async () => {
            const tx = await contract_rw.transfer(
                accounts[1],
                ethers.utils.parseEther('1000')
            )
            await tx.wait()

            //const signer = await ethers.getSigner()
            //console.log(ethers.utils.formatEther(await contract.balanceOf(signer.getAddress())))

            const balance = ethers.utils.formatEther(
                await contract.balanceOf(accounts[1])
            )
            expect(balance).to.equal('1000.0')
        })

        it("Should return 499999000.0 as sender's balance", async () => {
            const balance = ethers.utils.formatEther(
                await contract.balanceOf(accounts[0])
            )
            expect(balance).to.equal('499999000.0')
        })
    })
})
