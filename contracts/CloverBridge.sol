// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Clover ERC20 token contract
contract CloverBridge is AccessControl {
    using SafeERC20 for IERC20;
    // bridge role which could mint bridge transactions
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    event CrossTransfered(uint32 indexed chainId, bytes32 indexed dest, uint256 amount);

    event TranactionMinted(uint32 indexed chainId, bytes32 txHash, address indexed dest, uint256 amount);

    IERC20 public immutable _token;

    // chainId => minted transactions
    mapping(uint32 => mapping(bytes32 => bool)) public _mintedTransactions;

    constructor(IERC20 token) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(BRIDGE_ROLE, _msgSender());
        _token = token;
    }

    // return the token info
    function getToken() public view returns (IERC20) {
        return _token;
    }

    function crossTransfer(
        uint32 chainId,
        bytes32 dest,
        uint256 amount
    ) external returns (bool) {
        require(_token.transferFrom(msg.sender, address(this), amount), "CloverBridge: transfer failed");

        emit CrossTransfered(chainId, dest, amount);
        return true;
    }

    // mint a tx from outside to current chain(e.g. ethereum)
    // note here we use bytes32 to represent an unique transaction on the source chain
    // the txHash conventation should be identical between the bridge minters
    function mintTransaction(
        uint32 chainId,
        bytes32 txHash,
        address dest,
        uint256 amount
    ) external returns (bool) {
        require(hasRole(BRIDGE_ROLE, _msgSender()), "CloverBridge: bridge role");
        require(dest != address(0), "CloverBridge: invalid address");
        require(dest != address(this), "CloverBridge: invalid dest");
        require(_token.balanceOf(address(this)) >= amount, "CloverBridge: balance insufficient");

        require(!_mintedTransactions[chainId][txHash], "CloverBridge: tx already minted!");

        _mintedTransactions[chainId][txHash] = true;

        require(_token.transfer(dest, amount), "CloverBridge: transfer failed!");

        emit TranactionMinted(chainId, txHash, dest, amount);

        return true;
    }

    function hasMinted(uint32 chainId, bytes32 txHash) public view returns (bool) {
        return _mintedTransactions[chainId][txHash];
    }

    // helper method to withdraw tokens to the admin account
    function withdraw(IERC20 token) public returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "CloverBridge: must have admin role");
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
        return true;
    }
}
