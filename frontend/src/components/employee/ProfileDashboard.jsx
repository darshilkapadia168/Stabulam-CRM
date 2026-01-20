import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  Search, Plus, Mail, Phone, Download, Edit2, 
  Trash2, ArrowLeft, Filter, X, ChevronDown,
  UserMinus, FileText, Eye, Upload, Loader2,UsersIcon 
} from "lucide-react";
import EmployeeCard from "./shared/EmployeeCard";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import useEmployeePermissions from '../../hooks/useEmployeePermissions'; 

const API_URL = import.meta.env.VITE_API_URL;

// ✅ UPDATED DOCUMENTS TAB COMPONENT

function DocumentsTab({ employeeId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    category: 'Other'
  });


  
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

   const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    
    // Remove any duplicate /api/ from the path
    const cleanPath = fileUrl.replace(/\/api\/api\//g, '/api/');
    
    // Get the base URL from your API service
    const baseURL = api.defaults.baseURL || `${API_URL}/api`;
    
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

  const handleView = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    
    const fileUrl = doc.fileUrl || doc.filePath;
    if (!fileUrl) {
      alert("File URL not found");
      return;
    }

    const fullUrl = getFileUrl(fileUrl);
    console.log('🌐 Opening document:', fullUrl); // For debugging
    
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    } else {
      alert("Could not construct file URL");
    }
  };

  const handleDownload = async (e, doc) => {
    e.preventDefault();
    e.stopPropagation();

    const fileUrl = doc.fileUrl || doc.filePath;
    if (!fileUrl) {
      alert("File URL not found");
      return;
    }

    const fullUrl = getFileUrl(fileUrl);
    console.log('📥 Downloading document:', fullUrl); // For debugging

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
      link.download = doc.fileName || doc.title || "document";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download document. Please try again.");
    }
  };


const handleDelete = async (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/employees/${employeeId}/documents/${docId}`);
      alert('Document deleted successfully!');
      setDocuments(documents.filter(doc => doc._id !== docId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
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
      await api.post(`/employees/${employeeId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Document uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadForm({ file: null, title: '', category: 'Other' });
      
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
      <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
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

        {isUploadModalOpen && (
          <UploadModal 
            uploadForm={uploadForm}
            setUploadForm={setUploadForm}
            handleUpload={handleUpload}
            uploading={uploading}
            onClose={() => setIsUploadModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header with Upload Button */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Documents ({documents.length})</h3>
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
                {['Document Title', 'Category', 'Upload Date', 'Status', 'Actions'].map(h => (
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'Verified' 
                        ? 'bg-green-100 text-green-700' 
                        : doc.status === 'Rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-slate-400">
                      <button
                        onClick={(e) => handleView(e, doc)}
                        className="hover:text-indigo-600 transition-colors"
                        title="View"
                        type="button"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, doc)}
                        className="hover:text-indigo-600 transition-colors"
                        title="Download"
                        type="button"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, doc._id)}
                        className="hover:text-red-500 transition-colors"
                        title="Delete"
                        type="button"
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

      {isUploadModalOpen && (
        <UploadModal 
          uploadForm={uploadForm}
          setUploadForm={setUploadForm}
          handleUpload={handleUpload}
          uploading={uploading}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </>
  );
}

// ✅ UPLOAD MODAL COMPONENT
function UploadModal({ uploadForm, setUploadForm, handleUpload, uploading, onClose }) {
  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      onClick={() => !uploading && onClose()}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Upload Document</h3>
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Select File *
              </label>
              <input
                type="file"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
                disabled={uploading}
              />
              {uploadForm.file && (
                <p className="text-xs text-slate-500 mt-1">
                  Selected: {uploadForm.file.name}
                </p>
              )}
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                disabled={uploading}
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
                disabled={uploading}
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
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
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
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfileDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
   const {
    user: currentUser,
    canViewEmployees,
    canCreateEmployees,
  } = useEmployeePermissions();
  
    // 🔹 ADD THIS PERMISSION CHECK:
  const hasShownAlert = useRef(false);

  const [activeTab, setActiveTab] = useState("Overview");
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedDate, setSelectedDate] = useState("");

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data.employees || []);
      
      if (id) {
        const found = (response.data.employees || []).find(emp => emp._id === id);
        setCurrentEmployee(found);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDelete = (deletedEmployeeId) => {
    setEmployees(prevEmployees => 
      prevEmployees.filter(emp => emp._id !== deletedEmployeeId)
    );
    
    if (id === deletedEmployeeId) {
      navigate("/dashboard/employees/profiles");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [id]);

  useEffect(() => {
    if (location.state?.refresh) {
      console.log('🔄 Refreshing employee list...');
      fetchEmployees();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const name = emp.userId?.name || "";
    const designation = emp.jobInfo?.designation || "";
    const department = emp.jobInfo?.department || "";

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All Departments" || department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDept("All Departments");
    setSelectedDate("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 🔒 EMPLOYEE VIEW PERMISSION — BLOCK EVERYTHING
if (currentUser && !canViewEmployees) {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="text-center">
        <UsersIcon className="w-14 h-14 text-slate-300 mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-slate-800">
          Access Denied
        </h2>

        <p className="text-slate-500 mt-2">
          You don't have permission to view employees.
        </p>

        <p className="text-xs text-slate-400 mt-4">
          Current role:{" "}
          <span className="font-semibold">
            {currentUser?.role}
          </span>
        </p>
      </div>
    </div>
  );
}

  const isFilterActive = searchTerm !== "" || selectedDept !== "All Departments" || selectedDate !== "";

  // --- SINGLE EMPLOYEE PROFILE VIEW ---
  if (id && currentEmployee) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <button 
          onClick={() => navigate("/dashboard/employees/profiles")} 
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold text-sm mb-4 group"
        >
          <div className="p-1 bg-white rounded-md border border-slate-200 group-hover:border-indigo-200 shadow-sm transition-all">
            <ArrowLeft size={16} />
          </div>
          Back to Directory
        </button>
        
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img 
              src={currentEmployee.userId?.avatar || `https://ui-avatars.com/api/?name=${currentEmployee.userId?.name}&background=random`} 
              className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover" 
              alt="" 
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900">{currentEmployee.userId?.name}</h2>
              <p className="text-indigo-600 font-medium text-lg">
                {currentEmployee.jobInfo?.designation} , {currentEmployee.jobInfo?.department}
              </p>
            </div>
            
            {currentUser?.role === 'super_admin' && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  More Actions
                  <ChevronDown size={16} className={`transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => {
                        setIsActionsOpen(false);
                        navigate(`/dashboard/employees/edit/${currentEmployee._id}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={16} /> Edit Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                      <FileText size={16} /> Export Data
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <UserMinus size={16} /> Deactivate
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-10 mt-10 border-b border-slate-100">
            {['Overview', 'Documents', 'Activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold relative transition-all ${
                  activeTab === tab ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ COMPREHENSIVE DYNAMIC OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details */}
              {currentEmployee.personalDetails && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Personal Details</h3>
                  <p><strong>Full Name:</strong> {currentEmployee.userId?.name || '-'}</p>
                  <p><strong>Email:</strong> {currentEmployee.userId?.email || '-'}</p>
                  <p><strong>Date of Birth:</strong> {currentEmployee.personalDetails?.dob ? new Date(currentEmployee.personalDetails.dob).toLocaleDateString() : '-'}</p>
                  <p><strong>Gender:</strong> {currentEmployee.personalDetails?.gender || '-'}</p>
                  <p><strong>Marital Status:</strong> {currentEmployee.personalDetails?.maritalStatus || '-'}</p>
                  <p><strong>Nationality:</strong> {currentEmployee.personalDetails?.nationality || '-'}</p>
                </div>
              )}

              {/* Job Info */}
              {currentEmployee.jobInfo && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Job Information</h3>
                  <p><strong>Employee ID:</strong> {currentEmployee.jobInfo.employeeId || '-'}</p>
                  <p><strong>Designation:</strong> {currentEmployee.jobInfo.designation || '-'}</p>
                  <p><strong>Department:</strong> {currentEmployee.jobInfo.department || '-'}</p>
                  <p><strong>Joining Date:</strong> {currentEmployee.jobInfo.joiningDate ? new Date(currentEmployee.jobInfo.joiningDate).toLocaleDateString() : '-'}</p>
                  <p><strong>Location:</strong> {currentEmployee.jobInfo.location || '-'}</p>
                  <p><strong>Employment Type:</strong> {currentEmployee.jobInfo.employmentType || '-'}</p>
                  <p><strong>Reporting Manager:</strong> {currentEmployee.reportingManagerName || '-'}</p>
                </div>
              )}

              {/* Skills & Tools */}
              {(currentEmployee.skills?.length > 0 || currentEmployee.tools?.length > 0) && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Skills & Tools</h3>
                  {currentEmployee.skills?.length > 0 && <p><strong>Skills:</strong> {currentEmployee.skills.join(', ')}</p>}
                  {currentEmployee.tools?.length > 0 && <p><strong>Tools:</strong> {currentEmployee.tools.join(', ')}</p>}
                </div>
              )}

              {/* Previous Experience */}
              {currentEmployee.previousExperience?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Work Experience</h3>
                  {currentEmployee.previousExperience.map((exp, idx) => (
                    <div key={idx} className="mb-2">
                      <p><strong>Company:</strong> {exp.company}</p>
                      <p><strong>Role:</strong> {exp.role}</p>
                      <p><strong>Duration:</strong> {exp.duration}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Payroll */}
              {currentEmployee.payroll && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Payroll</h3>
                  <p><strong>Bank Name:</strong> {currentEmployee.payroll.bankName || '-'}</p>
                  <p><strong>Account Number:</strong> {currentEmployee.payroll.bankAcc || '-'}</p>
                  <p><strong>IFSC:</strong> {currentEmployee.payroll.ifsc || '-'}</p>
                  <p><strong>PAN:</strong> {currentEmployee.payroll.pan || '-'}</p>
                  <p><strong>Salary:</strong> {currentEmployee.payroll.salary ? `₹${currentEmployee.payroll.salary.toLocaleString()}` : '-'}</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Contact */}
              {currentEmployee.contactInfo && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Contact Info</h3>
                  <p><strong>Phone:</strong> {currentEmployee.contactInfo.phone || '-'}</p>
                  <p><strong>Email:</strong> {currentEmployee.contactInfo.secondaryEmail || '-'}</p>
                  <p><strong>Address:</strong> {currentEmployee.contactInfo.address || '-'}</p>
                  <p><strong>Emergency Contact:</strong> {currentEmployee.contactInfo.emergencyContact || '-'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ UPDATED: Pass employeeId to DocumentsTab */}
        {activeTab === "Documents" && (
          <DocumentsTab employeeId={currentEmployee._id} />
        )}

        {activeTab === "Activity" && (
          <div className="bg-white p-20 text-center rounded-2xl border border-slate-200 text-slate-400">
            Coming soon...
          </div>
        )}
      </div>
    );
  }



  // --- DIRECTORY GRID VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 flex-1">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search name or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 appearance-none cursor-pointer"
            >
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Product</option>
              <option>Marketing</option>
              <option>HR</option>
            </select>
          </div>
          {isFilterActive && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-all p-1"
            >
              <X size={14} /> Remove Filter
            </button>
          )}
        </div>

        {canCreateEmployees && (
         <button 
                onClick={() => navigate("/dashboard/employees/create")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md active:scale-95 transition-all whitespace-nowrap hover:bg-indigo-700"
          >
              <Plus size={18} />
              <span>Add New Employee</span>
          </button>

        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <EmployeeCard 
              key={emp._id} 
              employee={emp} 
              onDelete={handleEmployeeDelete}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No employees found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}