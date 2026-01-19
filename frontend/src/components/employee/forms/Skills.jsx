import React from 'react';

export default function Skills({ formData, setFormData, onNext, onPrev }) {
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      {/* --- SKILLS SECTION --- */}
      <h3 className="text-2xl font-semibold text-slate-800 mb-6">Skills & Tools</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee Primary Skills</label>
          <textarea 
            name="skills" 
            value={formData.skills} 
            onChange={handleChange} 
            placeholder="e.g. React, Tailwind, Node.js" 
            className="w-full border border-slate-300 rounded-lg p-2.5 h-20 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>

        {/* New Field: Proficient Tools */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Proficient Tools</label>
          <input 
            type="text" 
            name="tools" 
            value={formData.tools} 
            onChange={handleChange} 
            placeholder="e.g. Figma, Jira, VS Code, Slack" 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio Link</label>
          <input 
            type="url" 
            name="portfolio" 
            value={formData.portfolio} 
            onChange={handleChange} 
            placeholder="https://yourportfolio.com" 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>
      </div>

      <hr className="my-8 border-slate-100" />

      {/* --- PREVIOUS WORK EXPERIENCE SECTION --- */}
      <h3 className="text-2xl font-semibold text-slate-800 mb-6">Employee Previous Work Experience</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Previous Company Name</label>
          <input 
            type="text" 
            name="prevCompany" 
            value={formData.prevCompany} 
            onChange={handleChange} 
            placeholder="e.g. Tech Solutions Inc." 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role / Designation</label>
            <input 
              type="text" 
              name="prevRole" 
              value={formData.prevRole} 
              onChange={handleChange} 
              placeholder="e.g. Junior Developer" 
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Enter Duration</label>
            <input 
              type="text" 
              name="prevDuration" 
              value={formData.prevDuration} 
              onChange={handleChange} 
              placeholder="e.g. 2 Years (2021 - 2023)" 
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
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