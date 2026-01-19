import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Edit3, Loader2 } from 'lucide-react';
import Stepper from './shared/Stepper';
import BasicInfo from './forms/BasicInfo';
import Employment from './forms/Employment';
import Skills from './forms/Skills';
import Payroll from './forms/Payroll';
import Documents from './forms/Documents';
import api from '../../services/api';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', 
    dob: '', 
    gender: '', 
    email: '', 
    mobile: '',
    address: '',
    emergencyContact: '',
    maritalStatus: '',
    nationality: '',
    password: '',
    role: '',
    designation: '',
    joinDate: '', 
    employmentType: '', 
    workEmail: '', 
    workLocation: '', 
    department: '', 
    reportingManager: '',
    salary: '', 
    bankAcc: '', 
    ifsc: '', 
    pan: '',
    skills: '', 
    portfolio: '',
    startTime: '',
    endTime: ''
  });

  const fetchUserHistory = async (userId) => {
    if (!userId) return;

    try {
      setHistoryLoading(true);
      const res = await api.get(`/users/${userId}/history`);
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchEmployeeData = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/employees/${id}`);
          const emp = response.data;

          setFormData({
            userId: emp.userId?._id || '',
            fullName: emp.userId?.name || '',
            email: emp.userId?.email || '',
            role: emp.userId?.role || '',
            
            dob: emp.personalDetails?.dob ? emp.personalDetails.dob.split('T')[0] : '',
            gender: emp.personalDetails?.gender || '',
            maritalStatus: emp.personalDetails?.maritalStatus || '',
            nationality: emp.personalDetails?.nationality || '',
            
            mobile: emp.contactInfo?.phone || '',
            workEmail: emp.contactInfo?.secondaryEmail || '',
            address: emp.contactInfo?.address || '',
            emergencyContact: emp.contactInfo?.emergencyContact || '',
            
            designation: emp.jobInfo?.designation || '',
            joinDate: emp.jobInfo?.joiningDate ? emp.jobInfo.joiningDate.split('T')[0] : '',
            employmentType: emp.jobInfo?.employmentType || '',
            workLocation: emp.jobInfo?.location || '',
            department: emp.jobInfo?.department || '',
            
            reportingManager: emp.reportingManager?._id || '',
            
            salary: emp.payroll?.salary || '',
            bankName: emp.payroll?.bankName || '',
            branchName: emp.payroll?.branchName || '',
            bankAcc: emp.payroll?.bankAcc || '',
            ifsc: emp.payroll?.ifsc || '',
            pan: emp.payroll?.pan || '',
            
            skills: emp.skills?.join(', ') || '',
            tools: emp.tools?.join(', ') || '',
            portfolio: emp.portfolio || '',
            
            prevCompany: emp.previousExperience?.[0]?.company || '',
            prevRole: emp.previousExperience?.[0]?.role || '',
            prevDuration: emp.previousExperience?.[0]?.duration || '',
            
            documents: emp.documents || [],
            
            password: ''
          });

          setEmployeeName(emp.userId?.name || 'Employee');

          if (emp.userId?._id) {
            fetchUserHistory(emp.userId._id);
          }
        } catch (error) {
          console.error("Error fetching employee:", error);
          alert('Failed to load employee data');
          navigate('/dashboard/employees/profiles');
        } finally {
          setIsLoading(false);
        }
      };

      fetchEmployeeData();
    }
  }, [id, navigate]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // ✅ UPDATED: Handle document uploads after employee creation
  const handleFinalSubmit = async (uploadedDocs) => {
    if (isSubmitting) return;

    const missingFields = [];
    if (!formData.fullName?.trim()) missingFields.push('Full Name');
    if (!formData.email?.trim() && !formData.workEmail?.trim()) missingFields.push('Email');
    if (!id && !formData.password?.trim()) missingFields.push('Password');
    if (!formData.role?.trim()) missingFields.push('Role');

    if (missingFields.length > 0) {
      alert(`Please fill the following required fields:\n• ${missingFields.join('\n• ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const roleMapping = {
        intern: 'intern',
        'jr employee': 'jr_employee',
        'junior employee': 'jr_employee',
        'sr employee': 'sr_employee',
        'senior employee': 'sr_employee',
        'team leader': 'team_leader',
        management: 'management',
        manager: 'management',
        admin: 'admin',
        'super admin': 'super_admin',
        super_admin: 'super_admin'
      };
      const normalizedRole = formData.role?.trim().toLowerCase() || '';
      const userRole = roleMapping[normalizedRole] || 'intern';

      const isValidObjectId = (str) => str && /^[a-f\d]{24}$/i.test(str);

      const employeePayload = {
        userId: formData.userId || null,

        jobInfo: {
          employeeId: `EMP-${Date.now()}`,
          department: formData.department || 'Unassigned',
          designation: formData.designation || formData.role || 'New Hire',
          joiningDate: formData.joinDate || new Date(),
          location: formData.workLocation || null,
          employmentType: formData.employmentType || 'Full-time',
          startTime: formData.startTime || "09:00",
          endTime: formData.endTime || "18:00"
        },

        personalDetails: {
          dob: formData.dob || null,
          gender: formData.gender || null,
          maritalStatus: formData.maritalStatus || null,
          nationality: formData.nationality || null
        },

        contactInfo: {
          phone: formData.mobile || null,
          secondaryEmail: formData.workEmail || formData.email || null,
          address: formData.address || null,
          emergencyContact: formData.emergencyContact || null
        },

        payroll: {
          bankName: formData.bankName || null,
          branchName: formData.branchName || null,
          bankAcc: formData.bankAcc || null,
          ifsc: formData.ifsc || null,
          pan: formData.pan || null,
          salary: formData.salary ? Number(formData.salary) : null
        },

        reportingManager: isValidObjectId(formData.reportingManager)
          ? formData.reportingManager
          : null,

        skills: formData.skills
          ? formData.skills.split(',').map(s => s.trim())
          : [],

        tools: formData.tools
          ? formData.tools.split(',').map(t => t.trim())
          : [],

        previousExperience: formData.prevCompany
          ? [{
              company: formData.prevCompany,
              role: formData.prevRole,
              duration: formData.prevDuration
            }]
          : [],

        portfolio: formData.portfolio || null,
        documents: []
      };

      // -------------------- EDIT MODE --------------------
      if (id) {
        const updateUserRes = await api.put(`/users/${formData.userId}`, {
          name: formData.fullName,
          email: (formData.workEmail || formData.email).trim().toLowerCase(),
          role: userRole,
          ...(formData.password ? { password: formData.password } : {}),
        });

        employeePayload.userId = updateUserRes.data?._id || formData.userId;
        await api.put(`/employees/${id}`, employeePayload);

        // ✅ Upload documents if any (for edit mode, documents are uploaded immediately)
        // No need to upload here as DocumentForm handles it for edit mode

        fetchUserHistory(updateUserRes.data._id);

        alert("Employee updated successfully!");
        navigate("/dashboard/employees/profiles");
        return;
      }

      // -------------------- CREATE MODE --------------------
      const userPayload = {
        name: formData.fullName.trim(),
        email: (formData.workEmail || formData.email).trim().toLowerCase(),
        password: formData.password.trim(),
        role: userRole,
      };

      let createdUser;

      try {
        const userRes = await api.post("/users", userPayload);
        createdUser = userRes.data;

        if (!createdUser?._id) {
          throw new Error("User ID missing in response");
        }

        employeePayload.userId = createdUser._id;

        // ✅ Create employee first
        const employeeRes = await api.post("/employees", employeePayload);
        const createdEmployeeId = employeeRes.data.employee._id;

        // ✅ Now upload documents if any were selected
        if (uploadedDocs && Object.keys(uploadedDocs).length > 0) {
          console.log('📤 Uploading documents...', uploadedDocs);
          
          const uploadPromises = Object.values(uploadedDocs).map(async (doc) => {
            if (doc.file) {
              const formData = new FormData();
              formData.append('document', doc.file);
              formData.append('title', doc.title);
              formData.append('category', doc.category);

              try {
                await api.post(`/employees/${createdEmployeeId}/documents`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log(`✅ Uploaded: ${doc.title}`);
              } catch (err) {
                console.error(`❌ Failed to upload ${doc.title}:`, err);
              }
            }
          });

          await Promise.all(uploadPromises);
          console.log('✅ All documents uploaded!');
        }

        alert("Employee created successfully!");
        navigate("/dashboard/employees/profiles");
        return;

      } catch (err) {
        if (err.response?.status === 400) {
          alert(err.response.data.message);
          return;
        }
        throw err;
      }

    } catch (error) {
      console.error("Operation failed:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Operation failed";

      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[75vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800 tracking-tight">Loading Profile</p>
            <p className="text-sm text-slate-400">Please wait while we fetch employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <BasicInfo formData={formData} setFormData={setFormData} onNext={nextStep} isEdit={!!id} />;
      case 2: return <Employment formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Skills formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Payroll formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} />;
      case 5: return (
        <Documents 
          formData={formData} 
          onPrev={prevStep} 
          onSubmit={handleFinalSubmit} 
          isEdit={!!id} 
          employeeId={id}
          isSubmitting={isSubmitting}
        />
      );
      default: return <BasicInfo formData={formData} setFormData={setFormData} onNext={nextStep} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden mt-4">
      
      <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-200 flex flex-col">
        
        <div className="p-8 border-b border-slate-200 bg-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-5 shadow-sm shadow-indigo-100">
            {id ? <Edit3 size={22} /> : <UserPlus size={22} />}
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {id ? "Edit Details" : "Create Profile"}
          </h2>

          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mt-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${id ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
            {id ? `Editing: ${employeeName}` : "New Registration"}
          </p>
        </div>

        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200">
          <Stepper currentStep={currentStep} setCurrentStep={setCurrentStep} isEdit={!!id} />
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium text-center italic">
            All fields are saved locally until final submission.
          </p>
        </div>
      </div>

      <div className="flex-1 p-8 lg:p-20 overflow-y-auto bg-white custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          {renderStep()}

          {/* User History Panel */}
          {id && (
            <div className="mt-6">
              <h3 className="font-bold text-lg">User History</h3>
              {historyLoading ? (
                <p>Loading history...</p>
              ) : history.length === 0 ? (
                <p>No history available</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li key={item._id} className="p-2 border rounded bg-gray-50">
                      <p>
                        <strong>{item.performedByName}</strong> ({item.performedByRole}){" "}
                        {item.actionType} at {new Date(item.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{item.changes.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}