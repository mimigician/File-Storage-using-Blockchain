// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Storage {
    address private owner;
    mapping(string => mapping(address => bool)) private accessList;
    mapping(address => string[]) private uploaderFiles;
    mapping(string => File) private cids;

    struct File {
        string uploaderName;
        string fileName;
        string fileCid;
        address ownerAddress;
        address[] recipientAddresses;
        
    }

    mapping(string => File) private files;
    string[] private fileCids;

    event CidUploaded(string fileName, 
        string fileCid, address ownerAddress);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    function grantAccess(string memory cid, address user) public  {
        accessList[cid][user] = true;
    }

    function revokeAccess(string memory cid, address user) public  {
        accessList[cid][user] = false;
    }

    function canAccess(string memory cid, address user) public view returns (bool) {
        return accessList[cid][user];
    }

    function uploadCid(
        string memory uploaderName, string memory fileName, 
        string memory fileCid, address ownerAddress
        ) public {
        require(files[fileCid].ownerAddress == address(0), "File CID already uploaded");

        files[fileCid].uploaderName = uploaderName;
        files[fileCid].fileName = fileName;
        files[fileCid].fileCid = fileCid;
        files[fileCid].ownerAddress = msg.sender;
        //files[fileCid].recipientAddresses.push(recipientAddresses);
        accessList[fileCid][ownerAddress] = true;
        
        fileCids.push(fileCid);
        uploaderFiles[msg.sender].push(fileCid);

        emit CidUploaded(fileName, fileCid, ownerAddress);
    }

    function getCid(address uploaderAddress) public view returns (string memory) {
        require(uploaderAddress != address(0), "Invalid uploader address");

        string memory cid = "";
        bool hasAccess = false;

        // Iterate through all fileCids
        for (uint256 i = 0; i < fileCids.length; i++) {
            File storage file = files[fileCids[i]];

            // Check if the uploader address matches
            if (file.ownerAddress == uploaderAddress) {
                // Check if the user has access to the CID
                if (canAccess(file.fileCid, msg.sender)) {
                    cid = file.fileCid;
                    hasAccess = true;
                    break;
                }
            }
        }

        require(hasAccess, "User does not have access to any CID uploaded by the uploader");

        return cid;
    }

    function getUploadedCids(address uploaderAddress) public view returns (string[] memory) {
        return uploaderFiles[uploaderAddress];
    }

    function viewFileInfo(string memory fileCid) public view returns (string memory, string memory, address, address[] memory) {
        require(files[fileCid].ownerAddress != address(0), "File CID does not exist");

        File storage file = files[fileCid];
        return (file.uploaderName, file.fileName, file.ownerAddress, file.recipientAddresses);
    }
    function cidExists(string memory cid) public view returns (bool) {
        return cids[cid].ownerAddress != address(0);
    }

    function deleteFileRecord(string memory fileCid) public {
        require(files[fileCid].ownerAddress != address(0), "No file record found for this CID");
        require(files[fileCid].ownerAddress == msg.sender, "Only the owner can delete this file record");

        // Store the uploaderAddress before deleting the file record
        address uploaderAddress = files[fileCid].ownerAddress;

        delete files[fileCid];

        // Remove the fileCid from the fileCids array
        for (uint256 i = 0; i < fileCids.length; i++) {
            if (keccak256(abi.encodePacked(fileCids[i])) == keccak256(abi.encodePacked(fileCid))) {
                fileCids[i] = fileCids[fileCids.length - 1];
                fileCids.pop();
                break;
            }
        }

        // Remove the fileCid from the uploaderFiles mapping
        for (uint256 i = 0; i < uploaderFiles[uploaderAddress].length; i++) {
            if (keccak256(abi.encodePacked(uploaderFiles[uploaderAddress][i])) == keccak256(abi.encodePacked(fileCid))) {
                uploaderFiles[uploaderAddress][i] = uploaderFiles[uploaderAddress][uploaderFiles[uploaderAddress].length - 1];
                uploaderFiles[uploaderAddress].pop();
                break;
            }
        }
    }

    
}