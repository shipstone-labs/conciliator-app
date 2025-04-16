// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155URIStorage} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

/// @custom:security-contact andy@shipstone.com
contract IPDocV10 is ERC1155, AccessControl, ERC1155Pausable, ERC1155Burnable, ERC1155Supply, ERC1155URIStorage {
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant EXPIRATION_MANAGER_ROLE = keccak256("EXPIRATION_MANAGER_ROLE");
    
    mapping(bytes32 => uint256) private _tokenIdMap;
    mapping(uint256 => bytes32) private _reverseTokenIdMap;
    uint256 private _nextTokenId = 1;
    
    // Expiration timestamp mapping: address => tokenId => expiration timestamp
    // If timestamp is 0, the balance does not expire
    mapping(address => mapping(uint256 => uint256)) private _expirations;
    
    event IDCreated(bytes32 indexed externalId, uint256 indexed tokenId);
    event ExpirationSet(address indexed account, uint256 indexed tokenId, uint256 expirationTime);
    
    constructor(address defaultAdmin, address pauser, address minter)
        ERC1155("https://safeidea.net/doc/{id}") ERC1155URIStorage()
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(URI_SETTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(EXPIRATION_MANAGER_ROLE, minter); // Default to minter also managing expirations
    }


    // Create a function to register a bytes32 and get a manageable uint256
    function _createId(bytes32 externalId) internal {
        // Check if this bytes32 ID is already mapped
        if (_tokenIdMap[externalId] != 0) {
            return;
        }

        // Assign a new sequential uint256 ID
        uint256 newId = _nextTokenId++;

        // Store the mapping in both directions
        _tokenIdMap[externalId] = newId;
        _reverseTokenIdMap[newId] = externalId;
        
        emit IDCreated(externalId, newId);
    }

    function createId(bytes32 externalId) public onlyRole(MINTER_ROLE) {
      _createId(externalId);
    }

    function createIds(bytes32[] memory externalIds) public onlyRole(MINTER_ROLE) {
        for (uint256 i = 0; i < externalIds.length; i++) {
            _createId(externalIds[i]);
        }
    }

    // Retrieve the original bytes32 from a uint256 token ID
    function getExternalId(uint256 tokenId) public view returns (bytes32) {
        return _reverseTokenIdMap[tokenId];
    }

    function getId(bytes32 externalId) public view returns (uint256) {
        return _tokenIdMap[externalId];
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
        require(super.balanceOf(account, id) > 0, "IPDocV10: Account has no balance to expire");
        _expirations[account][id] = expirationTime;
        emit ExpirationSet(account, id, expirationTime);
    }
    
    /**
     * @dev Sets expiration timestamps for multiple token balances held by an account
     * @param account The address holding the tokens
     * @param ids Array of token IDs
     * @param expirationTimes Array of Unix timestamps when each balance should expire (0 for no expiration)
     */
    function setBatchExpiration(address account, uint256[] memory ids, uint256[] memory expirationTimes)
        public
        onlyRole(EXPIRATION_MANAGER_ROLE)
    {
        require(ids.length == expirationTimes.length, "IPDocV10: ids and expirationTimes length mismatch");
        
        for (uint256 i = 0; i < ids.length; i++) {
            require(super.balanceOf(account, ids[i]) > 0, "IPDocV10: Account has no balance to expire");
            _expirations[account][ids[i]] = expirationTimes[i];
            emit ExpirationSet(account, ids[i], expirationTimes[i]);
        }
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
    
    /**
     * @dev Override balanceOfBatch to return 0 for expired tokens
     * @param accounts Array of addresses
     * @param ids Array of token identifiers
     * @return Array of token balances, taking expiration into account
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) 
        public 
        view 
        virtual 
        override(ERC1155) 
        returns (uint256[] memory) 
    {
        require(accounts.length == ids.length, "IPDocV10: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
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
        _mint(account, id, amount, data);
    }
    
    /**
     * @dev Creates an external ID mapping and mints tokens in a single transaction
     * @param account Address to receive the minted tokens
     * @param externalId The external bytes32 ID to map
     * @param amount Amount of tokens to mint
     * @param data Additional data to pass to the mint function
     * @return The created token ID
     */
    function mintWithExternalId(
        address account,
        bytes32 externalId,
        uint256 amount,
        bytes memory data
    )
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        // Create the ID mapping first
        _createId(externalId);
        
        // Get the new token ID
        uint256 tokenId = _tokenIdMap[externalId];
        
        // Mint the tokens
        _mint(account, tokenId, amount, data);
        
        return tokenId;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }
    
    /**
     * @dev Creates multiple external ID mappings and mints tokens in a single transaction
     * @param to Address to receive the minted tokens
     * @param externalIds Array of external bytes32 IDs to map
     * @param amounts Array of amounts to mint for each token
     * @param data Additional data to pass to the mint function
     * @return Array of created token IDs
     */
    function mintBatchWithExternalIds(
        address to,
        bytes32[] memory externalIds,
        uint256[] memory amounts,
        bytes memory data
    )
        public
        onlyRole(MINTER_ROLE)
        returns (uint256[] memory)
    {
        require(externalIds.length == amounts.length, "IPDocV10: externalIds and amounts length mismatch");
        
        uint256[] memory tokenIds = new uint256[](externalIds.length);
        
        // First create all the ID mappings
        for (uint256 i = 0; i < externalIds.length; i++) {
            _createId(externalIds[i]);
            tokenIds[i] = _tokenIdMap[externalIds[i]];
        }
        
        // Then mint all the tokens
        _mintBatch(to, tokenIds, amounts, data);
        
        return tokenIds;
    }
    
    /**
     * @dev Transfer tokens with expiration in a single transaction
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param id Token ID to transfer
     * @param amount Amount to transfer
     * @param expirationTime Unix timestamp when the recipient's balance should expire (0 for no expiration)
     * @param data Additional data to pass to the transfer function
     */
    function safeTransferFromWithExpiration(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        uint256 expirationTime,
        bytes memory data
    )
        public
        onlyRole(MINTER_ROLE)
    {
        // First transfer the tokens
        safeTransferFrom(from, to, id, amount, data);
        
        // Then set the expiration if a non-zero value is provided
        if (expirationTime > 0) {
            _expirations[to][id] = expirationTime;
            emit ExpirationSet(to, id, expirationTime);
        }
    }
    
    /**
     * @dev Transfer batch of tokens with expiration in a single transaction
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param ids Array of token IDs to transfer
     * @param amounts Array of amounts to transfer
     * @param expirationTimes Array of Unix timestamps when each balance should expire (0 for no expiration)
     * @param data Additional data to pass to the transfer function
     */
    function safeBatchTransferFromWithExpiration(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        uint256[] memory expirationTimes,
        bytes memory data
    )
        public
        onlyRole(MINTER_ROLE)
    {
        require(ids.length == expirationTimes.length, "IPDocV10: ids and expirationTimes length mismatch");
        
        // First transfer the tokens
        safeBatchTransferFrom(from, to, ids, amounts, data);
        
        // Then set expirations for all tokens that have a non-zero expiration time
        for (uint256 i = 0; i < ids.length; i++) {
            if (expirationTimes[i] > 0) {
                _expirations[to][ids[i]] = expirationTimes[i];
                emit ExpirationSet(to, ids[i], expirationTimes[i]);
            }
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
            require(hasRole(MINTER_ROLE, _msgSender()), "IPDocV10: must have minter role to transfer");
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
                        require(to == address(0), "IPDocV10: Cannot transfer expired tokens except to burn");
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