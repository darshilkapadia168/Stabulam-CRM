import React, { useState, useEffect } from 'react';
import { Eye, Download, Trash2, Upload, X, Loader2, FileText } from 'lucide-react';
import api from '../../services/api';

export default function DocumentTable({ employeeId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    category: 'Other'
  });

  // Fetch documents on component mount
  useEffect(() => {
    if (employeeId) {
      fetchDocuments();
    }
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/employees/${employeeId}/documents`);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to construct proper file URL
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    // Remove any duplicate /api/ from the path
    const cleanPath = fileUrl.replace(/\/api\/api\//g, '/api/');
    
    // Get the base URL from your API service
    const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
    
    // If fileUrl already starts with http, return as is
    if (cleanPath.startsWith('http')) {
      return cleanPath;
    }
    
    // If fileUrl starts with /api, replace the /api part with the full base URL
    if (cleanPath.startsWith('/api')) {
      return cleanPath.replace('/api', baseURL);
    }
    
    // Otherwise, append to base URL
    return `${baseURL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const handleView = (doc) => {
    if (!doc.fileUrl) {
      alert("File URL not found");
      return;
    }

    const fullUrl = getFileUrl(doc.fileUrl);
    console.log('Opening document:', fullUrl); // For debugging
    
    if (fullUrl) {
      window.open(fullUrl, "_blank");
    } else {
      alert("Could not construct file URL");
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.fileUrl) {
      alert("File URL not found");
      return;
    }

    const fullUrl = getFileUrl(doc.fileUrl);
    console.log('Downloading document:', fullUrl); // For debugging

    try {
      // Fetch the file as a blob
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.title || "document";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/employees/${employeeId}/documents/${docId}`);
      alert('Document deleted successfully!');
      // Remove from state
      setDocuments(documents.filter(doc => doc._id !== docId));
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('document', uploadForm.file);
    formData.append('title', uploadForm.title || uploadForm.file.name);
    formData.append('category', uploadForm.category);

    try {
      const response = await api.post(`/employees/${employeeId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Document uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadForm({ file: null, title: '', category: 'Other' });
      
      // Refresh documents list
      fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white p-10 text-center rounded-2xl border border-slate-200">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-400 font-medium mb-4">No documents uploaded yet.</p>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
        >
          <Upload size={16} /> Upload Document
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header with Upload Button */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Documents</h3>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Document Title', 'Category', 'Upload Date', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{doc.title}</td>
                  <td className="px-6 py-4 text-slate-600">{doc.category}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-slate-400">
                      <button
                        onClick={() => handleView(doc)}
                        className="hover:text-indigo-600 transition-colors"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="hover:text-indigo-600 transition-colors"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(doc._id);
                        }}
                        className="hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div 
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={() => !uploading && setIsUploadModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Upload Document</h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Select File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Enter document title (optional)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="Identity">Identity</option>
                    <option value="Employment">Employment</option>
                    <option value="Education">Education</option>
                    <option value="Certification">Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={uploading}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}