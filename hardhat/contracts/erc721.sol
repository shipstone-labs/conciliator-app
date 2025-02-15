// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DocumentToken is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping to store document metadata
    struct Document {
        string name; // Document name
        string description; // Short description
    }
    mapping(uint256 => Document) public documents;
    mapping(uint256 => string) public contents;
    event DocumentTokenized(uint256 tokenId, string name, string description);

    constructor() ERC721("Intellectual Property", "IP") Ownable(msg.sender) {}

    /**
     * @dev Check if a tokenId exists in the documents mapping.
     * @param tokenId The token ID to check.
     * @return True if the token exists, false otherwise.
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return bytes(documents[tokenId].name).length > 0;
    }

    /**
     * @dev Tokenize a document by providing its metadata and CID.
     * @param name Document name.
     * @param description Document description.
     * @param content document content.
     */
    function tokenizeDocument(string memory name, string memory description, string memory content) external onlyOwner {
        uint256 tokenId = _nextTokenId;
        _mint(msg.sender, tokenId);
        // _setTokenURI(tokenId, cid);

        // Store document metadata
        documents[tokenId] = Document(name, description);
        contents[tokenId] = content;

        emit DocumentTokenized(tokenId, name, description);

        _nextTokenId++;
    }

    /**
     * @dev Get metadata for a document token.
     * @param tokenId The token ID.
     * @return Document metadata (name, description).
     */
    function getDocumentMetadata(uint256 tokenId) external view returns (Document memory) {
        require(_exists(tokenId), "Token does not exist");
        return documents[tokenId];
    }

    /**
     * @dev Get content for a document token.
     * @param tokenId The token ID.
     * @return string content.
     */
    function getDocument(uint256 tokenId) external view onlyOwner returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return contents[tokenId];
    }

    /**
     * @dev Set tokenURI.
     * @param tokenId The token ID.
      * @param cid IPFS CID pointing to the document content.
     */
    function setTokenURI(uint256 tokenId, string memory cid) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, cid);
    }
}