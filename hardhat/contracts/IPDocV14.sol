// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155URIStorage} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @custom:security-contact andy@shipstone.com
contract IPDocV14 is ERC1155, AccessControl, ERC1155Pausable, ERC1155Burnable, ERC1155Supply, ERC1155URIStorage {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant EXPIRATION_MANAGER_ROLE = keccak256("EXPIRATION_MANAGER_ROLE");
        
    // Expiration timestamp mapping: address => tokenId => expiration timestamp
    // If timestamp is 0, the balance does not expire
    mapping(address => mapping(uint256 => uint256)) private _expirations;
    
    // Mapping to track original owners of tokens
    mapping(uint256 => address) private _originalOwners;
    
    // Mapping to track ownership transfers
    mapping(uint256 => address) private _currentOwners;
    
    event ExpirationSet(address indexed account, uint256 indexed tokenId, uint256 expirationTime);
    event OwnershipTransferred(uint256 indexed tokenId, address indexed previousOwner, address indexed newOwner);
    
    constructor(address defaultAdmin, address pauser, address minter)
        ERC1155("https://safeidea.net/doc/{id}") ERC1155URIStorage()
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(URI_SETTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(EXPIRATION_MANAGER_ROLE, minter); // Default to minter also managing expirations
    }

    /**
     * @dev Get the original owner (creator) of a token
     * @param tokenId The token ID
     * @return The address of the original owner
     */
    function originalOwnerOf(uint256 tokenId) public view returns (address) {
        address owner = _originalOwners[tokenId];
        require(owner != address(0), "IPDocV12: token does not exist");
        return owner;
    }

    /**
     * @dev Get the current owner of a token
     * @param tokenId The token ID
     * @return The address of the current owner
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _currentOwners[tokenId];
        require(owner != address(0), "IPDocV12: token does not exist or ownership not explicitly set");
        return owner;
    }

    /**
     * @dev Transfer ownership of a token
     * @param tokenId The token ID
     * @param newOwner The address to transfer ownership to
     */
    function transferOwnership(uint256 tokenId, address newOwner) public {
        require(_currentOwners[tokenId] == _msgSender(), "IPDocV12: only current owner can transfer ownership");
        require(newOwner != address(0), "IPDocV12: cannot transfer ownership to the zero address");
        
        address previousOwner = _currentOwners[tokenId];
        _currentOwners[tokenId] = newOwner;
        
        emit OwnershipTransferred(tokenId, previousOwner, newOwner);
    }
        
    /**
     * @dev Sets an expiration timestamp for a specific token balance held by an account
     * @param account The address holding the tokens
     * @param id The token ID
     * @param expirationTime The Unix timestamp when the balance should expire (0 for no expiration)
     */
    function setExpiration(address account, uint256 id, uint256 expirationTime) 
        public 
        onlyRole(EXPIRATION_MANAGER_ROLE) 
    {
        require(super.balanceOf(account, id) > 0, "IPDocV12: Account has no balance to expire");
        _expirations[account][id] = expirationTime;
        emit ExpirationSet(account, id, expirationTime);
    }
    
    /**
     * @dev Gets the expiration timestamp for a specific token balance held by an account
     * @param account The address holding the tokens
     * @param id The token ID
     * @return The expiration timestamp (0 if no expiration)
     */
    function getExpiration(address account, uint256 id) public view returns (uint256) {
        return _expirations[account][id];
    }
    
    /**
     * @dev Checks if a specific token balance held by an account has expired
     * @param account The address holding the tokens
     * @param id The token ID
     * @return True if the balance has expired, false otherwise
     */
    function isExpired(address account, uint256 id) public view returns (bool) {
        uint256 expiration = _expirations[account][id];
        return expiration != 0 && expiration <= block.timestamp;
    }
    
    /**
     * @dev Override balanceOf to return 0 for expired tokens
     * @param account Address of token owner
     * @param id Token identifier
     * @return Token balance, taking expiration into account
     */
    function balanceOf(address account, uint256 id) public view virtual override(ERC1155) returns (uint256) {
        // Get the real balance from the parent implementation
        uint256 realBalance = super.balanceOf(account, id);
        
        // If the balance is zero or the account is the zero address, return 0
        if (realBalance == 0 || account == address(0)) {
            return 0;
        }
        
        // Check if the token balance has expired
        uint256 expiration = _expirations[account][id];
        if (expiration != 0 && expiration <= block.timestamp) {
            return 0; // Return 0 if expired
        }
        
        // Otherwise return the actual balance
        return realBalance;
    }

    function uri(uint256 tokenId) public view virtual override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }
    
    function setBaseURI(string memory baseURI) public onlyRole(URI_SETTER_ROLE) {
        _setBaseURI(baseURI);
    }
    
    function setTokenURI(uint256 tokenId, string memory tokenURI) public onlyRole(URI_SETTER_ROLE) {
        _setURI(tokenId, tokenURI);
    }
    
    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        // The token must not already have an owner
        address owner = _originalOwners[id];
        require(owner == address(0), "IPDocV12: token already is owned");

        _mint(account, id, amount, data);
        
        // Set this account as both the original and current owner if not already set
        _originalOwners[id] = account;
        _currentOwners[id] = account;
    }
    
    /**
     * @dev Mint by someone that's not an owner to themselves with a signature (created by owner)
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     * @param amount Amount to mint
     * @param expirationTime Optional expiration date (0=none)
     * @param data Additional data
     * @param signature Signature from the token owner
     */
    function mintWithSignature(
        address to, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 expirationTime,
        bytes memory data,
        bytes memory signature
    ) public {
        // The token must already exist and have an owner
        address owner = _currentOwners[tokenId];
        require(owner != address(0), "IPDocV12: token does not exist or has no owner");
        
        // Create a message hash that includes all relevant parameters
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(to, tokenId, amount, address(this)))
        ));
        
        // Recover the signer from the signature
        address signer = ECDSA.recover(messageHash, signature);
        
        // Verify the signature is from the token owner
        require(signer == owner, "IPDocV12: invalid signature");
        
        // Mint the token
        _mint(to, tokenId, amount, data);
        
        if (expirationTime > 0) {
            _expirations[to][tokenId] = expirationTime;
            emit ExpirationSet(to, tokenId, expirationTime);
        }
    }

    /**
     * @dev Mint by MINTER_ROLE of an already owned token with expiration
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     * @param amount Amount to mint
     * @param expirationTime Optional expiration date (0=none)
     * @param data extra data
     */
    function mintWithExpiration(
        address to, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 expirationTime,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        // The token must already exist and have an owner
        address owner = _currentOwners[tokenId];
        require(owner != address(0), "IPDocV12: token does not exist or has no owner");
        
        // Mint the token
        _mint(to, tokenId, amount, data);
        
        if (expirationTime > 0) {
            _expirations[to][tokenId] = expirationTime;
            emit ExpirationSet(to, tokenId, expirationTime);
        }
    }

    // The following functions are overrides required by Solidity.
    /**
     * @dev Override the _update function to check for expired balances and enforce transfer restrictions
     * If a balance has expired, the token transfer is allowed only for burning.
     * Only MINTER_ROLE can transfer tokens between addresses.
     */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        // If it's a transfer between two addresses (not minting or burning), only MINTER_ROLE can do it
        if (from != address(0) && to != address(0)) {
            require(hasRole(MINTER_ROLE, _msgSender()), "IPDocV12: must have minter role to transfer");
        }
        
        // Check for expired balances when transferring from a non-zero address
        if (from != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                // Only check for expiration on non-zero transfers
                if (values[i] > 0) {
                    // Check if the balance has expired
                    uint256 expiration = _expirations[from][ids[i]];
                    
                    // If expiration is set (non-zero) and the current time is past the expiration
                    if (expiration != 0 && expiration <= block.timestamp) {
                        // Allow transfers to zero address (burns) of expired tokens
                        require(to == address(0), "IPDocV12: Cannot transfer expired tokens except to burn");
                    }
                }
            }
        }
        
        // Call the parent implementation to execute the transfer
        super._update(from, to, ids, values);
        
        // Handle expiration mapping when transferring to a non-zero address (clearing expiration)
        if (to != address(0) && from != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (values[i] > 0) {
                    // When transferring all tokens, clear the expiration
                    // Use ERC1155Supply's totalSupply(id) and balanceOf(account, id) directly
                    // since our overridden balanceOf would return 0 for expired tokens
                    if (super.balanceOf(from, ids[i]) == 0) {
                        delete _expirations[from][ids[i]];
                    }
                }
            }
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}