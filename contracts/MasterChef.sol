// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./HOWLCapped.sol";
import "./interfaces/IGameItem.sol";

// MasterChef is the master of HOWL. He can make HOWL and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once HOWL is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 lastDepositTimestamp; // Deposit timestamp
        bool staked;
        
        // for NFT staking pool
        uint256[] stakedNFTs; // array of NFT id is staked
        uint256 nftStakingPoint;
        uint256 lastNFTDepositTimestamp;

        // We do some fancy math here. Basically, any point in time, the amount of HOWLs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accHowlPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accHowlPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. HOWLs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that HOWLs distribution occurs.
        uint256 accHowlPerShare; // Accumulated HOWLs per share, times 1e12. See below.
        uint256 totalNftStakingPoint;
    }

    // The HOWL TOKEN!
    HOWLCapped public howl;
    // Game NFT
    IGameItem public nft;
    // Dev address.
    address public devaddr;
    // CAKE tokens created per block.
    uint256 public howlPerBlock;
    // Bonus muliplier for early howl makers.
    uint256 public BONUS_MULTIPLIER = 1;
    // Lock time
    uint256 public lockTime = 0 days;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when CAKE mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 timestamp);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event DepositNFT(address indexed user, uint256 indexed pid, uint256[] tokenIds, uint256 timestamp);
    event WithdrawNFT(address indexed user, uint256 indexed pid, uint256[] tokenIds);
    event EmergencyWithdrawNFT(address indexed user, uint256 indexed pid, uint256 tokenId);

    constructor(
        address _howl,
        address _devaddr,
        uint256 _howlPerBlock,
        uint256 _startBlock
    ) {
        howl = HOWLCapped(_howl);
        devaddr = _devaddr;
        howlPerBlock = _howlPerBlock;
        startBlock = _startBlock;

        poolInfo.push(PoolInfo({
            lpToken: IERC20(address(0)),
            allocPoint: 0,
            lastRewardBlock: _startBlock,
            accHowlPerShare: 0,
            totalNftStakingPoint: 0
        }));
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accHowlPerShare: 0,
            totalNftStakingPoint: 0
        }));
    }

    // Update the given pool's HOWL allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
        }
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    // View function to see pending HOWLs on frontend.
    function pendingHowl(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accHowlPerShare = pool.accHowlPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 howlReward = multiplier.mul(howlPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accHowlPerShare = accHowlPerShare.add(howlReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accHowlPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 howlReward = multiplier.mul(howlPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        //howl.mint(devaddr, howlReward.div(10));
        //howl.mint(address(this), howlReward);
        IERC20(address(howl)).safeTransferFrom(owner(), devaddr, howlReward.div(10));
        IERC20(address(howl)).safeTransferFrom(owner(), address(this), howlReward);
        pool.accHowlPerShare = pool.accHowlPerShare.add(howlReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for HOWL allocation.
    function deposit(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, 'deposit: not LP token pool');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accHowlPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                safeHowlTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        if (user.amount >= 60 ether) {
            user.staked = true;
        }
        user.rewardDebt = user.amount.mul(pool.accHowlPerShare).div(1e12);
        user.lastDepositTimestamp = block.timestamp;

        emit Deposit(msg.sender, _pid, _amount, user.lastDepositTimestamp);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, 'deposit: not LP token pool');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.lastDepositTimestamp.add(lockTime) <= block.timestamp, "withdraw: withdrawal is only available after lock time");
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accHowlPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            safeHowlTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        if (user.amount < 60 ether) {
            user.staked = false;
        }
        user.rewardDebt = user.amount.mul(pool.accHowlPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Deposit NFT to NFT staking pool
    function depositNFT(uint256[] memory _nftIds) external {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];

        for (uint256 i = 0; i < _nftIds.length; i++) {
            uint256 nftId = _nftIds[i];

            IERC721(address(nft)).transferFrom(msg.sender, address(this), nftId);
            user.stakedNFTs.push(nftId);
            user.nftStakingPoint += getStakingPoint(nftId);
            pool.totalNftStakingPoint += getStakingPoint(nftId);
        }

        user.lastNFTDepositTimestamp = block.timestamp;

        emit DepositNFT(msg.sender, 0, _nftIds, user.lastNFTDepositTimestamp);
    }

    // Withdraw NFT from NFT staking pool
    function withdrawNFT(uint256[] memory _nftIds) external {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];

        require(user.lastNFTDepositTimestamp.add(lockTime) <= block.timestamp, "withdrawNFT: NFT withdrawal is only available after lock time");

        for (uint256 i = 0; i < _nftIds.length; i++) {
            uint256 nftId = _nftIds[i];

            IERC721(address(nft)).transferFrom(address(this), msg.sender, nftId);
            user.nftStakingPoint -= getStakingPoint(nftId);
            pool.totalNftStakingPoint -= getStakingPoint(nftId);
        }

        emit WithdrawNFT(msg.sender, 0, _nftIds);
    }

    function getPoolNftStakingPoint() public view returns (uint256) {
        PoolInfo storage pool = poolInfo[0];
        return pool.totalNftStakingPoint; 
    }

    // Safe HOWL transfer function, just in case if rounding error causes pool to not have enough HOWLs.
    function safeHowlTransfer(address _to, uint256 _amount) internal {
        uint256 howlBal = howl.balanceOf(address(this));
        if (_amount > howlBal) {
            howl.transfer(_to, howlBal);
        } else {
            howl.transfer(_to, _amount);
        }
    }

    function getStakingPoint(uint256 nftId) internal view returns (uint256) {
        (uint256 _tokenId, uint256 star) = nft.getGameItem(nftId);
        uint256 point = 50;
        if (star == 5) point = 500;
        else if (star == 4) point = 250;
        else if (star == 3) point = 100;
        return point;
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}
