import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import FileUploader from './FileUploader';
import Access from './Access';
import './css/FileUploader.css';
import './css/App.css';

function App() {
  const navigate = useNavigate();

  const goBackToUploadPage = () => {
    navigate('/');
  };

  return (
    <div className="App">
      <h1>File Uploader</h1>
      {window.location.pathname !== '/access' && (
        <Link to="/access"><button>Go to Access Page</button></Link>
      )}
      {window.location.pathname !== '/' && (
        <button onClick={goBackToUploadPage}>Go to Upload Page</button>
      )}
      <Routes>
        <Route path="/" element={<FileUploader />} />
        <Route path="/access" element={<Access />} />
      </Routes>
    </div>
  );
}

export default App;