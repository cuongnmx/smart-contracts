const { expect } = require('chai')
const { ethers } = require('hardhat')

const deploy = async (contract, totalSupply, name, symbol) => {
    const Contract = await ethers.getContractFactory(contract)
    const _contract = await Contract.deploy(totalSupply, name, symbol)
    await _contract.deployed()
    return _contract.address
}

describe.skip('ERC20Token', () => {
    let contract, contract_rw, accounts, contract_2, contract_2_rw

    before(async () => {
        accounts = await ethers.provider.listAccounts()
        const genericErc20Abi = require('../Erc20Abi.json')

        const address = await deploy('ERC20Token', 500000000, 'HOWL', 'HWL')

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

        const address_2 = await deploy('ERC20Token', 10000000, 'TEST', 'TST')

        contract_2 = new ethers.Contract(
            address_2,
            genericErc20Abi,
            ethers.provider
        )

        contract_2_rw = new ethers.Contract(
            address_2,
            genericErc20Abi,
            await ethers.getSigner()
        )
    })

    describe.skip('#constructor()', () => {
        it('Should return total supply of 500000000.0', async () => {
            const totalSupply = ethers.utils.formatEther(
                await contract.totalSupply()
            )
            expect(totalSupply).to.equal('500000000.0')
        })

        it('Should return 500000000.0 tokens of contract deployer', async () => {
            const Contract = await ethers.getContractFactory('ERC20Token')
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

    describe.skip('#transfer()', () => {
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

    let uniswap, pair, liquidityCalculator
    before(async () => {
        const UniswapV2FactoryBytecode =
            require('@uniswap/v2-core/build/UniswapV2Factory.json').bytecode
        const Uniswap = await ethers.getContractFactory(
            [
                'constructor(address _feeToSetter)',
                'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
                'function getPair(address tokenA, address tokenB) external view returns (address pair)',
                'function allPairs(uint) external view returns (address pair)',
                'function allPairsLength() external view returns (uint)',
                'function feeTo() external view returns (address)',
                'function feeToSetter() external view returns (address)',
                'function createPair(address tokenA, address tokenB) external returns (address pair)'
            ],
            UniswapV2FactoryBytecode
        )

        const signer = await ethers.getSigner()
        uniswap = await Uniswap.deploy(signer.address)
        await uniswap.deployed()

        pair = await uniswap.createPair(contract.address, contract_2.address)
        await pair.wait()

        //const pairAddress = await uniswap.getPair(contract.address, contract_2.address)

        const LiquidityCalculator = await ethers.getContractFactory(
            'LiquidityValueCalculator'
        )
        liquidityCalculator = await LiquidityCalculator.deploy(uniswap.address)
        await liquidityCalculator.deployed()
    })

    describe('liquidity#computeLiquidityShareValue()', () => {
        it('Should do something', async () => {
            let res = await liquidityCalculator.computeLiquidityShareValue(
                10000,
                contract.address,
                contract_2.address
            )
            console.log(res)
        })
    })
})
