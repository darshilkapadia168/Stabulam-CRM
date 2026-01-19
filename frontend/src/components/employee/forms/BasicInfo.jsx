import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function BasicInfo({ formData, setFormData, onNext, isEdit }) {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Password required only for new employees
    if (!isEdit && !formData.password) {
      alert('Please set a password for the new employee');
      return;
    }
    
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-slate-800">Basic Information</h3>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit ? "Update employee's personal details" : "Enter new employee's basic information"}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange}
            disabled={isEdit} // ✅ Can't change name in edit mode
            className={`w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              isEdit ? 'bg-slate-100 cursor-not-allowed text-slate-600' : ''
            }`}
            placeholder="John Doe" 
            required
          />
          {isEdit && (
            <p className="text-xs text-slate-500 mt-1">Name cannot be changed here. Update in User Management if needed.</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <input 
            type="date" 
            name="dob" 
            value={formData.dob} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <div className="flex gap-4 mt-2">
            {['Male', 'Female', 'Other'].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input 
                  type="radio" 
                  name="gender" 
                  value={opt} 
                  onChange={handleChange} 
                  checked={formData.gender === opt} 
                  className="accent-indigo-600" 
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange}
            disabled={isEdit} // ✅ Can't change email in edit mode
            className={`w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${
              isEdit ? 'bg-slate-100 cursor-not-allowed text-slate-600' : ''
            }`}
            placeholder="example@mail.com"
            required
          />
          {isEdit && (
            <p className="text-xs text-slate-500 mt-1">Email is the login ID and cannot be changed.</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
          <input 
            type="tel" 
            name="mobile" 
            value={formData.mobile} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="+91 98765 43210" 
          />
        </div>

        {/* Address (Full Width) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea 
            name="address" 
            rows="2"
            value={formData.address || ''} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            placeholder="Street address, City, State, ZIP"
          ></textarea>
        </div>

        {/* Emergency Contact & Relationship Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
          <input 
            type="tel" 
            name="emergencyContact" 
            value={formData.emergencyContact || ''} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Emergency phone" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
          <select 
            name="maritalStatus" 
            value={formData.maritalStatus || ''} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        {/* Password - Only show when creating new employee */}
        {!isEdit && (
          <div className="col-span-2 relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Set Password <span className="text-red-500">*</span>
            </label>
            <input 
              type={showPass ? "text" : "password"} 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)} 
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <p className="text-xs text-slate-500 mt-1">This will be the employee's login password</p>
          </div>
        )}

        {/* Info box for edit mode */}
        {isEdit && (
          <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Email and password management is handled through User Management. 
              Contact admin to reset password if needed.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-end gap-4">
        <button 
          type="button" 
          onClick={() => navigate('/dashboard/employees/profiles')} 
          className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          className="px-10 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all font-bold"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}