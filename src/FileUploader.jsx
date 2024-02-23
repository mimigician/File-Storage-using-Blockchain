import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import './css/FileUploader.css';
import CryptoJS from 'crypto-js';


const client = create({
    host: '127.0.0.1',
    port: 5001,
    protocol: 'http',
});

function FileUploaderComponent() {
    function encrypt(plaintext, secret) {
        var key = CryptoJS.enc.Utf8.parse(secret);
        let iv = CryptoJS.lib.WordArray.create(key.words.slice(0, 4));
        //console.log("IV : " + CryptoJS.enc.Base64.stringify(iv));

        var cipherText = CryptoJS.AES.encrypt(plaintext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return cipherText.toString();
    }

    function decrypt(cipherText, secret) {
        var key = CryptoJS.enc.Utf8.parse(secret);
        let iv = CryptoJS.lib.WordArray.create(key.words.slice(0, 4));
        let ivBase64 = CryptoJS.enc.Base64.stringify(iv);
        let iv1 = CryptoJS.enc.Base64.parse(ivBase64);

        var cipherBytes = CryptoJS.enc.Base64.parse(cipherText);

        var decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherBytes }, key, {
            iv: iv1,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    }


    const temp = "tota";
    //const encrypted = encrypt(temp, process.env.REACT_APP_ENCRYPTION_KEY);
    const encrypted = "oluQaGB1UDG1ftiGI0W9CzAk7weaJ68dLzJCuiKqZPtGTee+s8T3RACItqzwAGJM";
    //console.log('enc: ',encrypted);
    const decrypted = decrypt(encrypted, process.env.REACT_APP_ENCRYPTION_KEY);
    //console.log('dec', decrypted);



    const [uploaderName, setUploaderName] = useState('');
    const [fileName, setFileName] = useState('');
    const [recipientAddresses, setRecipientAddresses] = useState('');
    const fileInput = useRef(null);
    const [fileCid, setFileCid] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [savedMessage, setSavedMessage] = useState('');

    const [fileUrls, setFileUrls] = useState([]);
    const [uploaderAddress, setUploaderAddress] = useState('');
    const [viewIPFSimage, setViewIPFSimage] = useState(false);

    const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
    const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;
    const API_KEY = process.env.REACT_APP_API_KEY;

    async function handleUploadToIPFS() {
        const file = fileInput.current.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const  enc_cid  = encrypt((await client.add(reader.result)).cid.toString(), process.env.REACT_APP_ENCRYPTION_KEY);
                console.log('enc_cid: ', enc_cid);
                setFileCid(enc_cid);
                //setFileCid(cid.toString());
                //console.log('File CID:', cid.toString()); // Show the file CID after uploading
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
            console.log(ethers.utils.isAddress(signer.address));

            const uploaderAddress = await signer.getAddress();

            // Check if the CID already exists in the contract
            const cidExists = await contract.cidExists(fileCid);
            if (cidExists) {
                console.log('The file CID already exists in the contract.');
                return;
            }
            const transaction = await contract.uploadCid(uploaderName, fileName, fileCid, uploaderAddress);
            await transaction.wait();

            setSavedMessage('CID saved to blockchain successfully!');
            console.log(fileCid);

            // Call the grantAccess function with the CID and recipient address
            // const grantAccessTransaction = await contract.grantAccess(fileCid, recipientAddresses);
            // await grantAccessTransaction.wait();

            // console.log('Access granted to recipient successfully!');

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
            let urls = [];
            for (let i = 0; i < uploadedCids.length; i++) {
                const cid = uploadedCids[i];
                const accessList = await contract.canAccess(cid, signer.address);
                console.log('Access List:', accessList);
                const signerAddress = await signer.getAddress();
                console.log('Signer Address:', signerAddress);
                
                if (await contract.canAccess(cid, signer.address)) {
                    console.log('Can Access:', cid);

                    //const stream = client.cat(cid.toString());
                    const stream = client.cat(decrypt(cid.toString(),process.env.REACT_APP_ENCRYPTION_KEY).toString());
                    /////////////////
                    const dec_cid = decrypt(cid, process.env.REACT_APP_ENCRYPTION_KEY);
                    console.log('decrypted: ',decrypted);
                    let data = [];

                    for await (const chunk of stream) {
                        data.push(chunk);
                    }
                    console.log('data: ',data);
                    // Create a Blob from the data 
                    const blob = new Blob(data, { type: 'image/jpeg' });
                    // Create a URL from the Blob
                    const url = URL.createObjectURL(blob);
                    const fileInfo = await contract.viewFileInfo(cid);
                    urls.push({ cid: cid, url: url, fileName: fileInfo[1], decrypted: dec_cid}); // Filename is in FileInfo[1]
                    
                    console.log('File Info:', fileInfo[1]);
                    //setFileUrls(prevUrls => ({ ...prevUrls, [cid]: { url, fileInfo } }));
                    // console.log('File URL:', url);
                    // console.log('File Info:', fileInfo[1]);
                }
            }
            setFileUrls(urls);
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
        <div className='FileUploader'>
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
            {/* <input
                type="text"
                placeholder="Recipient Addresses"
                onChange={(e) => setRecipientAddresses(e.target.value)}
            /> */}
            <input type="file" ref={fileInput} />

            <button onClick={handleUploadToIPFS}>Upload to IPFS</button>
            <button onClick={saveCidToBlockchain}>Save CID to Blockchain</button>
            <p style={{ margin: '10px 0', color: 'black', fontWeight: 'bold' }}>{savedMessage}</p> <br />
            <div>
            </div>
            {/* <button onClick={fetchFileFromIPFS}>Fetch File</button>
            {fileCid && <p>Your file CID is: {fileCid}</p>}
            {fileContent && (
                <div>
                    <h3>Fetched File Content:</h3>
                    <pre>{fileContent}</pre>
                </div>
            )} */}
            <input
                type="text"
                placeholder="Uploader Address"
                onChange={(e) => setUploaderAddress(e.target.value)}
            />
            <button onClick={fetchFileFromIPFS}>Fetch File from IPFS</button>

            {/* {Object.entries(fileUrls).map(([cid, url]) => (
                <div className='file' key={cid}>
                    
                    <p>File Name: {fileUrls[cid].fileInfo[1]}</p> 
                    {url && <a href={url} download>Download File</a>}
                </div>
            ))} */}
            {fileUrls.map((file, index) => (
                <div className='file' key={index}>
                    <p>File name: {file.fileName}</p>
                    {/* <a href={file.url} download>Download File</a> */}
                    <a href={'ipfs://' + file.decrypted} download>Download File</a> 
                </div>

            ))}
        </div>
    );
}

export default FileUploaderComponent;
