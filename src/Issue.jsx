import React, { useState, useRef,useEffect } from 'react';
import { ethers } from 'ethers';
import './css/Issue.css'
import { create } from 'ipfs-http-client';
//import {  Link } from 'react-router-dom';

//let ViewIPFSimage=false;

const client = create({
  host: '127.0.0.1',
  port: 5001,
  protocol: 'http',
});


function IssueCertificateComponent() {
  const [studentName, setStudentName] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [subject, setSubject] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [issueResult, setIssueResult] = useState('');
 
  const CONTRACT_ADDRESS = '0xAF8CFFb1d5eEc6502f4E5129AB0BFc8948D1C3e0';
  const API_KEY = 'Hzg6WEnaqothqt1HOwPgAeW2vH0jRuEO';
  const PRIVATE_KEY = '28964b96024c507c9d19cdaec8c4b17848416a397fa61fc1640c0f91d4a82bf3';
  const fileInput = useRef(null);
  const [fileCid, setFileCid] = useState(null);
  //const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (fileCid) {
      console.log(fileCid);
    }
  }, [fileCid]);

  async function handleUploadToIPFS() {
    const file = fileInput.current.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const {cid}  = await client.add(reader.result);
        console.log(cid);
        setFileCid(cid.toString());
      
      };
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      
      console.error('Error uploading file:', error);
    }
  }



  const issueCertificate = async () => {
    try {
      const network = 'maticmum';
      const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);

      const contractABI = require('./abis/CertificateNFT.json');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const issueTimestamp = Math.floor(Date.now() / 1000); // Get current timestamp
      
      if(fileCid){
      const transaction = await contract.issueCertificate(
        studentName,
        degreeName,
        subject,
        studentAddress,
        issueTimestamp,
        fileCid
        );
        await transaction.wait();
  
      }
     else{console.log('Cid is null');}

      setIssueResult('Certificate issued successfully!');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setIssueResult('Failed to issue certificate' + '-->' + error);
    }
  };

  return (
    <div className='issue-certificate-container'>
      <h1>Issue Certificate</h1>
      <input
        type="text"
        placeholder="Student Name"
        onChange={(e) => setStudentName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Degree Name"
        onChange={(e) => setDegreeName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject"
        onChange={(e) => setSubject(e.target.value)}
      />
      <input
        type="text"
        placeholder="Student Address"
        onChange={(e) => setStudentAddress(e.target.value)}
      />

      <input type="file" ref={fileInput} />
      <button onClick={handleUploadToIPFS} style={{marginBottom:10,}}>Upload to IPFS</button> <br/>
{/* 
      <button onClick={() => fetchFileFromIPFS(fileCid)}>View From IPFS</button>  <br/>      */}
      
      <button onClick={issueCertificate}>Issue Certificate</button> <br/>
      <p>{issueResult}</p><br/>
      


    </div>

    
  );

}

export default IssueCertificateComponent;

