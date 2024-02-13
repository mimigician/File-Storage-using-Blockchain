import React, { useState } from 'react';
import { ethers } from 'ethers';

function Access({ contractAddress, abi }) {
  const [recipientAddress, setRecipientAddress] = useState('');

  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
  const API_KEY = 'Hzg6WEnaqothqt1HOwPgAeW2vH0jRuEO';

  const network = 'maticmum';
  const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const contractABI = require('./abis/Storage.json');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  const handleGrantAccess = async () => {
    const fileCids = await contract.getUploadedCids(signer.address);
    for (let cid of fileCids) {
      await contract.grantAccess(cid, recipientAddress);
      console.log(`Access granted to ${recipientAddress} on file CID: ${cid}`);
    }
  };

  const handleRevokeAccess = async () => {
    const fileCids = await contract.getUploadedCids(signer.address);
    for (let cid of fileCids) {
      await contract.revokeAccess(cid, recipientAddress);
      console.log(`Access revoked for ${recipientAddress} on file CID: ${cid}`);
    }
  };

  return (
    <div>
      <input type="text" placeholder="Recipient Address" onChange={e => setRecipientAddress(e.target.value)} />
      <button onClick={handleGrantAccess}>Grant Access</button>
      <button onClick={handleRevokeAccess}>Revoke Access</button>
    </div>
  );
}

export default Access;