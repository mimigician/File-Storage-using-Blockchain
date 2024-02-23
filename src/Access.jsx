import React, { useState } from 'react';
import { ethers } from 'ethers';

function Access({ contractAddress, abi }) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [accessList, setAccessList] = useState([]);

  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
  const API_KEY = process.env.REACT_APP_API_KEY;

  const network = 'maticmum';
  const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const start = performance.now();
  const contractABI = require('./abis/Storage.json');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  

  const handleGrantAccess = async () => {
    const fileCids = await contract.getUploadedCids(signer.address);
    for (let cid of fileCids) {
      await contract.grantAccess(cid, recipientAddress);
      console.log('cid',cid)
      setConfirmationMessage(`Access granted to User successfully!`);
      const end = performance.now();
  console.log('Time taken to save CID to blockchain:', end - start, 'ms');
    }
  };

  const handleRevokeAccess = async () => {
    const fileCids = await contract.getUploadedCids(signer.address);
    for (let cid of fileCids) {
      await contract.revokeAccess(cid, recipientAddress);
      setConfirmationMessage(`Access revoked for User successfully! `);
      const end = performance.now();
  console.log('Time taken to save CID to blockchain:', end - start, 'ms');
    }
  };

  const handleGetAccessList = async () => {
    const accessListAddresses = await contract.getAccessList();
    setAccessList(accessListAddresses); 
  };

  return (
    <div>
      <input type="text" placeholder="Recipient Address" onChange={e => setRecipientAddress(e.target.value)} />
      <button onClick={handleGrantAccess}>Grant Access</button>
      <button onClick={handleRevokeAccess}>Revoke Access</button>
      {/* <button onClick={handleGetAccessList}>Get Access List</button> */}
      {confirmationMessage && <p style={{ margin: '10px 0', color: 'black', fontWeight: 'bold' }}>{confirmationMessage}</p>}
      {accessList.length > 0 && <p>Access List: {accessList.join(', ')}</p>}
    </div>
  );
}

export default Access;