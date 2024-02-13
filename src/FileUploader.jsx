import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import './css/FileUploader.css'


const client = create({
    host: '127.0.0.1',
    port: 5001,
    protocol: 'http',
});

function FileUploaderComponent() {
    const [uploaderName, setUploaderName] = useState('');
    const [fileName, setFileName] = useState('');
    const [recipientAddresses, setRecipientAddresses] = useState('');
    const fileInput = useRef(null);
    const [fileCid, setFileCid] = useState(null);
    const [fileContent, setFileContent] = useState(null);

    //const [fileUrl, setFileUrl] = useState(null);
    const [fileUrls, setFileUrls] = useState({});
    const [uploaderAddress, setUploaderAddress] = useState('');
    const[viewIPFSimage, setViewIPFSimage]=useState(false);

    const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
    const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
    const API_KEY = 'Hzg6WEnaqothqt1HOwPgAeW2vH0jRuEO';

    async function handleUploadToIPFS() {
        const file = fileInput.current.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const { cid } = await client.add(reader.result);
                setFileCid(cid.toString());
                console.log('File CID:', cid.toString()); // Show the file CID after uploading
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    async function saveCidToBlockchain() {
        try {
            const network = 'maticmum';
            const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
            const signer = new ethers.Wallet(PRIVATE_KEY, provider);

            const contractABI = require('./abis/Storage.json');
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
            console.log(contract.interface.functions);
            console.log(ethers.utils.isAddress(CONTRACT_ADDRESS));
            console.log(ethers.utils.isAddress(recipientAddresses));
            console.log(ethers.utils.isAddress(signer.address));
            
            const uploaderAddress = await signer.getAddress();
            
            // Check if the CID already exists in the contract
            const cidExists = await contract.cidExists(fileCid);
            if (cidExists) {
                console.log('The file CID already exists in the contract.');
                return;
            }

            const transaction = await contract.uploadCid(uploaderName, fileName, fileCid, uploaderAddress, recipientAddresses);
            await transaction.wait();

            console.log('CID saved to blockchain successfully!');

            // Call the grantAccess function with the CID and recipient address
            const grantAccessTransaction = await contract.grantAccess(fileCid, recipientAddresses);
            await grantAccessTransaction.wait();

            console.log('Access granted to recipient successfully!');
            
        } catch (error) {
            console.error('Error saving CID to blockchain:', error);
        }
    }

    async function fetchFileFromIPFS() {
        try {
            const network = 'maticmum';
            const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
            const signer = new ethers.Wallet(PRIVATE_KEY, provider);
            setViewIPFSimage(true);
    
            const contractABI = require('./abis/Storage.json');
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
    
            const uploadedCids = await contract.getUploadedCids(uploaderAddress);
            console.log('Uploader Address:', uploaderAddress);
            console.log('Uploaded Cids:', uploadedCids);
            for (let i = 0; i < uploadedCids.length; i++) {
                const cid = uploadedCids[i];
                const accessList = await contract.canAccess(cid, signer.address);
                console.log('Access List:', accessList);
                if (await contract.canAccess(cid, signer.address)) {
                    console.log('Can Access:', cid);
                    
                    const stream = client.cat(cid);
                    let data = [];

                    for await (const chunk of stream) {
                        data.push(chunk);
                    }
                    // Create a Blob from the data
                    const blob = new Blob(data, { type: 'image/jpeg' });
                    // Create a URL from the Blob
                    const url = URL.createObjectURL(blob);
                    const fileInfo = await contract.viewFileInfo(cid);
                    setFileUrls(prevUrls => ({ ...prevUrls, [cid]: { url, fileInfo } }));
                    console.log('File URL:', url);
                    console.log('File Info:', fileInfo[1]);
                    } 
                }
            }
                catch (error) {
                        console.error('Error fetching file from IPFS:', error);
                    }
        //             const { content } = await client.cat(cid);
        //             if (content) {
        //                 setFileContent(content.toString());
        //                 setFileCid(cid);
        //                 break;
        //             }
        //         }
        //     }
        //     console.log('im here');
        // } catch (error) {
        //     console.error('Error fetching file from IPFS:', error);
        // }
                    
    }

    return (
        <div>
            <input
                type="text"
                placeholder="Uploader Name"
                onChange={(e) => setUploaderName(e.target.value)}
            />
            <input
                type="text"
                placeholder="File Name"
                onChange={(e) => setFileName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Recipient Addresses"
                onChange={(e) => setRecipientAddresses(e.target.value)}
            />
            <input type="file" ref={fileInput} />
            <input
            type="text"
            placeholder="Uploader Address"
            onChange={(e) => setUploaderAddress(e.target.value)}
        />
            <button onClick={handleUploadToIPFS}>Upload to IPFS</button>
            <button onClick={saveCidToBlockchain}>Save CID to Blockchain</button>
            {/* <button onClick={fetchFileFromIPFS}>Fetch File</button>
            {fileCid && <p>Your file CID is: {fileCid}</p>}
            {fileContent && (
                <div>
                    <h3>Fetched File Content:</h3>
                    <pre>{fileContent}</pre>
                </div>
            )} */}
            <button onClick={fetchFileFromIPFS}>Fetch File from IPFS</button>
            
            {Object.entries(fileUrls).map(([cid, url]) => (
                <div key={cid}>
                    <p>CID: {cid}</p>
                    <p>File Name: {fileUrls[cid].fileInfo[1]}</p>
                    <a href={url} download>Download File</a>
                </div>
            ))}
            </div>
    );
}

export default FileUploaderComponent;
