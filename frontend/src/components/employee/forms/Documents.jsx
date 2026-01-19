import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function Documents({ formData, onPrev, onSubmit, isEdit, employeeId, isSubmitting }) {
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploading, setUploading] = useState(null);

  const docTypes = [
    { key: "gov_id", label: "Government ID", category: "Identity" },
    { key: "exp_letter", label: "Experience Letter", category: "Experience" },
    { key: "resume", label: "Resume", category: "Professional" },
    { key: "edu_cert", label: "Educational Certificate", category: "Education" }
  ];

  // ✅ Fetch existing documents if editing
  useEffect(() => {
    if (isEdit && employeeId) {
      fetchExistingDocuments();
    }
  }, [isEdit, employeeId]);

  const fetchExistingDocuments = async () => {
    try {
      const response = await api.get(`/employees/${employeeId}/documents`);
      const docs = response.data.documents || [];
      
      // Map existing documents to uploadedDocs state
      const mapped = {};
      docs.forEach(doc => {
        const docType = docTypes.find(dt => dt.category === doc.category);
        if (docType) {
          mapped[docType.key] = {
            uploaded: true,
            fileName: doc.title,
            _id: doc._id
          };
        }
      });
      setUploadedDocs(mapped);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (docType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOC, DOCX, and image files are allowed');
      return;
    }

    // Upload file
    setUploading(docType.key);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', docType.label);
      formData.append('category', docType.category);

      // If editing existing employee, upload to their record immediately
      if (isEdit && employeeId) {
        const response = await api.post(`/employees/${employeeId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Mark as uploaded with server response
        setUploadedDocs(prev => ({
          ...prev,
          [docType.key]: {
            uploaded: true,
            fileName: file.name,
            _id: response.data.document._id
          }
        }));
      } else {
        // For new employees, store file temporarily to upload after employee creation
        setUploadedDocs(prev => ({
          ...prev,
          [docType.key]: {
            uploaded: true,
            fileName: file.name,
            file: file,
            category: docType.category,
            title: docType.label
          }
        }));
      }
      
      setUploading(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Upload failed');
      setUploading(null);
    }
  };

  // ✅ Handle final submission
  const handleFinish = () => {
    const uploadedCount = Object.keys(uploadedDocs).length;
    
    // Validation: require all docs for new employees only
    if (!isEdit && uploadedCount < docTypes.length) {
      alert('Please upload all required documents before proceeding.');
      return;
    }

    // Pass uploaded documents to parent
    onSubmit(uploadedDocs);
  };

  // Remove uploaded document
  const handleRemove = async (docKey) => {
    const doc = uploadedDocs[docKey];
    
    // If editing and document exists on server, delete it
    if (isEdit && employeeId && doc._id) {
      try {
        await api.delete(`/employees/${employeeId}/documents/${doc._id}`);
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document');
        return;
      }
    }

    // Remove from state
    setUploadedDocs(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  const uploadedCount = Object.keys(uploadedDocs).length;
  const allUploaded = uploadedCount === docTypes.length;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-slate-800 mb-2">Document Upload</h3>
        <p className="text-sm text-slate-500">
          {isEdit 
            ? "Update or add new documents to the employee profile" 
            : "Upload required documents to complete the registration"
          }
        </p>
        
        {/* Progress Indicator */}
        {!isEdit && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">Upload Progress</span>
              <span className="text-xs font-bold text-indigo-600">{uploadedCount}/{docTypes.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(uploadedCount / docTypes.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {docTypes.map((docType) => {
          const isUploaded = uploadedDocs[docType.key];
          const isCurrentlyUploading = uploading === docType.key;

          return (
            <div 
              key={docType.key} 
              className={`p-4 border-2 border-dashed rounded-xl flex items-center justify-between transition-all duration-300 ${
                isUploaded 
                  ? "border-green-500 bg-green-50/30" 
                  : "border-slate-200 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${isUploaded ? "bg-green-100" : "bg-slate-100"}`}>
                  <FileText className={isUploaded ? "text-green-600" : "text-slate-400"} size={20} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-bold block ${isUploaded ? "text-green-700" : "text-slate-600"}`}>
                    {docType.label}
                  </span>
                  {isUploaded && (
                    <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">
                      {isUploaded.fileName}
                    </p>
                  )}
                  {isCurrentlyUploading && (
                    <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">
                      Uploading...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentlyUploading ? (
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <Loader2 size={14} className="animate-spin" /> Uploading...
                  </div>
                ) : isUploaded ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-white border border-green-200 px-3 py-1.5 rounded-lg shadow-sm">
                      <CheckCircle size={14} /> DONE
                    </div>
                    <button
                      onClick={() => handleRemove(docType.key)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Remove document"
                      disabled={isSubmitting}
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                ) : (
                  <label className={`flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Upload size={14} /> UPLOAD
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(docType, e)}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* File Size Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 mt-0.5" />
        <div className="text-xs text-blue-800">
          <strong>Accepted formats:</strong> PDF, DOC, DOCX, JPG, PNG<br />
          <strong>Maximum file size:</strong> 5MB per document
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex justify-between items-center gap-4">
        <button 
          onClick={onPrev} 
          disabled={isSubmitting || uploading}
          className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        
        <div className="flex items-center gap-3">
          {isEdit && !allUploaded && (
            <button
              onClick={handleFinish}
              disabled={isSubmitting || uploading}
              className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
            >
              Skip Documents
            </button>
          )}
          
          <button 
            onClick={handleFinish}
            disabled={isSubmitting || uploading || (!isEdit && !allUploaded)}
            className={`px-10 py-2 rounded-lg shadow-lg font-bold transition-all flex items-center gap-2 ${
              (allUploaded || isEdit) && !uploading && !isSubmitting
                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isEdit ? 'UPDATING...' : 'CREATING...'}
              </>
            ) : (
              <>
                {isEdit ? 'UPDATE PROFILE' : 'FINISH & CREATE'}
              </>
            )}
          </button>
        </div>
      </div>

      {!allUploaded && !isEdit && (
        <p className="mt-4 text-xs text-center text-amber-600 font-medium">
          ⚠️ Please upload all {docTypes.length} documents to complete registration
        </p>
      )}
    </div>
  );
}