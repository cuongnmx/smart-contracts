const { expect } = require('chai')
const { ethers } = require('hardhat')

describe.skip('ERC20Capped', () => {
    it('deploy', async () => {
        const howlAbi = require('../artifacts/contracts/HOWL.sol/HOWL.json').abi

        const howlDeploy = await ethers.getContractFactory('HOWL')
        const howl = await howlDeploy.deploy()
        await howl.deployed()

        this.signers = await ethers.getSigners()
        this.howl = new ethers.Contract(howl.address, howlAbi, this.signers[0])
    })

    it('mint 100 mil', async () => {
        let res = await this.howl.mint(
            this.signers[0].address,
            ethers.utils.parseEther('100000000')
        )
        balance = await this.howl.balanceOf(this.signers[0].address)
        expect(ethers.utils.formatEther(balance)).to.equal('100000000.0')
    })

    it('mint 400 mil', async () => {
        const res = await this.howl.mint(
            this.signers[1].address,
            ethers.utils.parseEther('440000000')
        )
        const balance = await this.howl.balanceOf(this.signers[1].address)
        expect(ethers.utils.formatEther(balance)).to.equal('440000000.0')
    })

    it('mint 1 and exceed cap', async () => {
        try {
            const res = await this.howl.mint(
                this.signers[2].address,
                ethers.utils.parseEther('1')
            )
            const balance = await this.howl.balanceOf(this.signers[2].address)
        } catch (err) {
            expect(err.message).to.equal(
                "VM Exception while processing transaction: reverted with reason string 'ERC20: cap exceeded'"
            )
        }
    })
})
