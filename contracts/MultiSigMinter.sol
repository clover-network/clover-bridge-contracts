// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICloverBridge {
    function mintTransaction(
        uint32 chainId,
        bytes32 txHash,
        address dest,
        uint256 amount
    ) external returns (bool);
}

// MultiSigMinter contract
contract MultiSigMinter is AccessControl {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // chainBridgeId: List<address>
    mapping(uint32 => mapping(address => bool)) public _bridgeMinters;
    mapping(uint32 => BridgeConfig) public _bridgeConfig;

    event BridgeConfigChanged(uint32 indexed chainBridgeId, uint8 minSigs, uint256 fee);
    event BridgeRemoved(uint32 indexed chainBridgeId);
    event MinterAdded(uint32 indexed chainBridgeId, address minter);
    event MinterRemoved(uint32 indexed chainBridgeId, address minter);

    ICloverBridge public immutable _bridge;

    constructor(ICloverBridge bridge) {
        _bridge = bridge;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    struct BridgeConfig {
        uint8 minSigs;
        uint256 mintFee;
    }

    struct SigInfo {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint64 deadline;
        address minter;
    }

    function verifySig(
        SigInfo calldata sig,
        uint32 chainBridgeId,
        bytes32 txHash,
        address dest,
        uint256 amount
    ) public view returns (bool) {
        bytes memory prefix = "\x19ClvBridgeMinter:\n32";
        // address + chainBridgeId is unique across all bridge deployments
        // it's safe to upgrade the contract without the concern of the replay attack.
        bytes32 proof = keccak256(abi.encodePacked(prefix, address(this), chainBridgeId, txHash, dest, amount, sig.deadline));
        address recovered = ecrecover(proof, sig.v, sig.r, sig.s);
        return recovered == sig.minter;
    }

    function mintTransaction(
        SigInfo[] calldata sigs, // sigs must be ordered by minter address
        bytes32 txHash,
        uint32 chainBridgeId,
        address dest,
        uint256 amount
    ) external returns (bool) {
        require(hasRole(RELAYER_ROLE, _msgSender()), "MultiSigMinter: no perm");
        BridgeConfig memory cfg = _bridgeConfig[chainBridgeId];
        require(isBridgeEnabled(chainBridgeId), "MultiSigMinter: bridge disabled");
        require(sigs.length >= cfg.minSigs, "MultiSigMinter: sig threshold");
        for (uint256 i = 0; i < sigs.length; i++) {
            SigInfo calldata sig = sigs[i];
            require(sig.minter != address(0), "MultiSigMinter: invalid minter");
            require(sig.deadline >= block.number, "MultiSigMinter: expired");
            if (i > 0) {
                require(sig.minter > sigs[i - 1].minter, "MultiSigMinter: incorrect order");
            }
            require(_bridgeMinters[chainBridgeId][sig.minter], "MultiSigMinter: invalid minter");
            require(verifySig(sig, chainBridgeId, txHash, dest, amount), "MultiSigMinter: incorrect sig");
        }

        require(_bridge.mintTransaction(chainBridgeId, txHash, dest, amount), "MultiSigMinter: failed");

        return true;
    }

    function setBridgeParams(
        uint32 chainBridgeId,
        uint8 minSigs,
        uint256 fee
    ) external returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "MultiSigMinter: must have admin role");
        _bridgeConfig[chainBridgeId] = BridgeConfig({minSigs: minSigs, mintFee: fee});
        emit BridgeConfigChanged(chainBridgeId, minSigs, fee);
        return true;
    }

    function disableBridge(uint32 chainBridgeId) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "MultiSigMinter: must have admin role");
        delete _bridgeConfig[chainBridgeId];
        emit BridgeRemoved(chainBridgeId);
    }

    function isBridgeEnabled(uint32 chainBridgeId) public view returns (bool) {
        return _bridgeConfig[chainBridgeId].minSigs > 1;
    }

    function addMinter(uint32 chainBridgeId, address minter) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "MultiSigMinter: must have admin role");
        _bridgeMinters[chainBridgeId][minter] = true;
        emit MinterAdded(chainBridgeId, minter);
    }

    function removeMinter(uint32 chainBridgeId, address minter) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "MultiSigMinter: must have admin role");
        delete _bridgeMinters[chainBridgeId][minter];
        emit MinterRemoved(chainBridgeId, minter);
    }
}
