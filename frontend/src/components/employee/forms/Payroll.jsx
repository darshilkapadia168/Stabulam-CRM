import React from 'react';
import { Landmark } from 'lucide-react';

export default function Payroll({ formData, setFormData, onNext, onPrev }) {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Landmark className="text-green-600" size={24} />
        </div>
        <h3 className="text-2xl font-semibold text-slate-800">Payroll Details</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Row 1: Bank Name & Branch Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
          <input 
            type="text" 
            name="bankName" 
            value={formData.bankName} 
            onChange={handleChange} 
            placeholder="e.g. HDFC Bank"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
          <input 
            type="text" 
            name="branchName" 
            value={formData.branchName} 
            onChange={handleChange} 
            placeholder="e.g. Althan Branch"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        {/* Row 2: Bank Account Number (Full Width) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account Number</label>
          <input 
            type="text" 
            name="bankAcc" 
            value={formData.bankAcc} 
            onChange={handleChange} 
            placeholder="Enter 12-16 digit account number"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        {/* Row 3: IFSC Code & PAN Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
          <input 
            type="text" 
            name="ifsc" 
            value={formData.ifsc} 
            onChange={handleChange} 
            placeholder="HDFC0001234"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
          <input 
            type="text" 
            name="pan" 
            value={formData.pan} 
            onChange={handleChange} 
            placeholder="ABCDE1234F"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-10 flex justify-end gap-4">
        <button 
          onClick={onPrev} 
          className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          Back
        </button>
        <button 
          onClick={onNext} 
          className="px-10 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}