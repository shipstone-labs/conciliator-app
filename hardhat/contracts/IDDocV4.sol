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
contract IPDocV4 is ERC1155, AccessControl, ERC1155Pausable, ERC1155Burnable, ERC1155Supply, ERC1155URIStorage {
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(bytes32 => uint256) private _tokenIdMap;
    mapping(uint256 => bytes32) private _reverseTokenIdMap;
    uint256 private _nextTokenId = 1;

    // Create a function to register a bytes32 and get a manageable uint256
    function _createId(bytes32 externalId) internal returns (uint256) {
        // Check if this bytes32 ID is already mapped
        if (_tokenIdMap[externalId] != 0) {
            return _tokenIdMap[externalId];
        }

        // Assign a new sequential uint256 ID
        uint256 newId = _nextTokenId++;

        // Store the mapping in both directions
        _tokenIdMap[externalId] = newId;
        _reverseTokenIdMap[newId] = externalId;

        return newId;
    }

    function createId(bytes32 externalId) public onlyRole(MINTER_ROLE) returns (uint256) {
      return _createId(externalId);
    }
    function createIds(bytes32[] memory externalIds) public onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](externalIds.length);
        for (uint256 i = 0; i < externalIds.length; i++) {
            ids[i] = _createId(externalIds[i]);
        }
        return ids;
    }

    // Retrieve the original bytes32 from a uint256 token ID
    function getExternalId(uint256 tokenId) public view returns (bytes32) {
        return _reverseTokenIdMap[tokenId];
    }
    function getId(bytes32 externalId) public view returns (uint256) {
        return _tokenIdMap[externalId];
    }
    
    constructor(address defaultAdmin, address pauser, address minter)
        ERC1155("https://safeidea.net/doc/{id}") ERC1155URIStorage()
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(URI_SETTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
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

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
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
