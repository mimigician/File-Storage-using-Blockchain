import React, { useState } from 'react';
import { ethers } from 'ethers';

function DeleteFileRecord() {
  const [fileCid, setFileCid] = useState('');
  const [deleteResult, setDeleteResult] = useState('');

  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
  const API_KEY = process.env.REACT_APP_API_KEY;

  const network = 'maticmum';
  const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const contractABI = require('./abis/Storage.json');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  const deleteFileRecord = async () => {
    try {
      const transaction = await contract.deleteFileRecord(fileCid);

      await transaction.wait();

      setDeleteResult('File record deleted successfully!');
    } catch (error) {
      console.error('Error deleting file record:', error);
      setDeleteResult('Failed to delete file record' + '-->' + error);
    }
  };

  return (
    <div className='delete-file-record-container'>
      <h1>Delete File Record</h1>
      <input type="text" placeholder="File CID" onChange={(e) => setFileCid(e.target.value)} />

      <button onClick={deleteFileRecord}>Delete File Record</button> <br/>
      <p>{deleteResult}</p><br/>
    </div>
  );
}

export default DeleteFileRecord;