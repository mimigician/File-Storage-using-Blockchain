import React, { useState } from 'react';
import { ethers } from 'ethers';



const Verify = () => {
    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState('');

    const verifyCertificate = async () => {
        try {
            // Connect to the deployed contract
            const contractAddress = '0xFEF2D8d536F07A973D68A6E4f2dC5acf43e10a10'; // Replace with the actual contract address
            const provider = new ethers.providers.JsonRpcProvider();
            const contract = new Contract(contractAddress, CertificateNFT.abi, provider);

            // Call the verifyCertificate function in the contract
            const result = await contract.verifyCertificate(certificateId);

            // Update the verification result state
            setVerificationResult(result);
        } catch (error) {
            console.error('Error verifying certificate:', error);
        }
    };

    return (
        <div>
            <h1>Verify Certificate</h1>
            <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
            />
            <button onClick={verifyCertificate}>Verify</button>
            <p>{verificationResult}</p>
        </div>
    );
};

export default Verify;
