import React, { useState } from 'react';

/**
 * The "New Experiment" form page
 */
export const NewExperimentPage = ({ onAddExperiment, onCancel }) => {
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [protocol, setProtocol] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !hypothesis) {
      alert("Please fill in at least a title and hypothesis.");
      return;
    }
    
    const newExperiment = {
      id: `EXP-${String(Date.now()).slice(-3)}`, // simple unique-ish ID
      title,
      hypothesis,
      protocol,
      status: 'Planning',
      startDate: new Date().toISOString().split('T')[0],
      owner: 'Dr. User', // Assume current user
      logs: [],
      analysis: ''
    };
    
    onAddExperiment(newExperiment);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Start New Experiment</h1>
      
      <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
            Experiment Title
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="e.g., Protein Analysis of Sample C"
            />
          </div>
        </div>

        <div>
          <label htmlFor="hypothesis" className="block text-sm font-medium leading-6 text-gray-900">
            Hypothesis / Objective
          </label>
          <div className="mt-2">
            <textarea
              id="hypothesis"
              rows={3}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="What do you expect to find?"
            />
          </div>
        </div>

        <div>
          <label htmlFor="protocol" className="block text-sm font-medium leading-6 text-gray-900">
            Protocol / Procedure
          </label>
          <div className="mt-2">
            <textarea
              id="protocol"
              rows={8}
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="List the steps for your experiment..."
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">(Optional) You can add a detailed protocol later.</p>
        </div>
        
        <div className="flex items-center gap-x-4">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Experiment
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

