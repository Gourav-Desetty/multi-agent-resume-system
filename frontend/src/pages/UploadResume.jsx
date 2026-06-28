import React, { useState, useCallback } from 'react';
import { UploadCloud, File, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import client from '../api/client';
import Notification from '../components/Notifications';

export default function UploadResume() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const addFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'docx'].includes(ext);
    });

    if (validFiles.length < selectedFiles.length) {
      setNotification({
        type: 'warning',
        message: 'Some files were ignored. Only PDF and DOCX formats are supported.'
      });
    }

    setFiles((prev) => {
      // Avoid duplicate filenames
      const currentNames = prev.map(f => f.name);
      const filteredNew = validFiles.filter(f => !currentNames.includes(f.name));
      return [...prev, ...filteredNew];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(10);
    setNotification(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Simulate uploading steps
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const response = await client.post('/api/candidates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setProgress(100);
      
      setNotification({
        type: 'success',
        message: `Successfully uploaded and parsed ${response.data.length} resume(s).`
      });
      setFiles([]);
      
    } catch (error) {
      console.error("Upload failure:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Resume upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload Candidate Resumes</h1>
        <p className="text-sm text-brand-muted mt-1">Submit resumes in PDF or Word (DOCX) formats to execute the multi-agent screening system.</p>
      </div>

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition cursor-pointer text-center relative ${
          dragActive 
            ? 'border-brand-primary bg-brand-primary/5 text-brand-text' 
            : 'border-brand-border bg-brand-card text-brand-muted hover:border-brand-primary/50'
        }`}
      >
        <input 
          type="file" 
          multiple 
          accept=".pdf,.docx" 
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <UploadCloud className="text-brand-primary mb-4 animate-bounce" size={48} />
        <p className="text-base font-semibold text-brand-text mb-1">Drag and drop files here, or click to browse</p>
        <p className="text-xs text-brand-muted">Supported formats: PDF, DOCX (Max 10MB per file)</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Selected files ({files.length})</h3>
          <div className="divide-y divide-brand-border/60">
            {files.map((file, index) => (
              <div key={index} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3 text-brand-text truncate">
                  <File size={16} className="text-brand-primary shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xxs text-brand-muted font-mono shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  onClick={() => removeFile(index)} 
                  disabled={uploading}
                  className="text-brand-muted hover:text-red-400 p-1 rounded hover:bg-brand-dark transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Uploading to database...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-brand-dark rounded-full h-2 overflow-hidden border border-brand-border">
                <div 
                  className="bg-brand-primary h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-brand-primary/25 transition disabled:opacity-50"
            >
              Start screening pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
