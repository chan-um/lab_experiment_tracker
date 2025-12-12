import React, { useState, useEffect } from 'react';
import { IconPaperClip, IconTrash, IconPencil } from '../components/icons';
import { experimentsAPI, filesAPI } from '../services/api';
import { FileUploadModal } from '../components/FileUploadModal';

/**
 * The detailed view for a single experiment (the "notebook")
 */
export const ExperimentDetailPage = ({ experiment, onUpdateExperiment, onDeleteExperiment, onNavigate, user }) => {
  // Check if current user owns this experiment (prefer ID; fallback to name for older data)
  const isOwner =
    !!user &&
    (
      (experiment.ownerId && user.id === experiment.ownerId) ||
      (experiment.owner && user.name && experiment.owner === user.name)
    );
  const [activeTab, setActiveTab] = useState('logs');
  const [newLog, setNewLog] = useState('');
  const [analysisText, setAnalysisText] = useState(experiment.analysis || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(experiment.title || '');
  const [editHypothesis, setEditHypothesis] = useState(experiment.hypothesis || '');
  const [editProtocol, setEditProtocol] = useState(experiment.protocol || '');

  // Update state when experiment changes
  useEffect(() => {
    setAnalysisText(experiment.analysis || '');
    setEditTitle(experiment.title || '');
    setEditHypothesis(experiment.hypothesis || '');
    setEditProtocol(experiment.protocol || '');
  }, [experiment]);

  const handleFileUpload = async (file) => {
    try {
      const updated = await filesAPI.upload(experiment.id, file);
      onUpdateExperiment(experiment.id, updated);
    } catch (err) {
      throw new Error(err.message || 'Failed to upload file');
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setIsDeletingFile(fileId);
    try {
      const updated = await filesAPI.delete(experiment.id, fileId);
      onUpdateExperiment(experiment.id, updated);
    } catch (err) {
      alert('Failed to delete file. Please try again.');
      console.error('Failed to delete file:', err);
    } finally {
      setIsDeletingFile(null);
    }
  };

  const handleFileDownload = (fileId) => {
    const url = filesAPI.getDownloadUrl(experiment.id, fileId);
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleStatusChange = (e) => {
    onUpdateExperiment(experiment.id, { status: e.target.value });
  };
  
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.trim() || isSaving) return;
    
    setIsSaving(true);
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    try {
      const logEntry = { timestamp, content: newLog };
      const updated = await experimentsAPI.addLog(experiment.id, logEntry);
      // The API returns the full updated experiment, but handleUpdateExperiment expects updates object
      // So we need to update the state directly via the callback
      onUpdateExperiment(experiment.id, updated);
      setNewLog('');
    } catch (err) {
      console.error('Failed to add log:', err);
      alert('Failed to add log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAnalysisSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateExperiment(experiment.id, { analysis: analysisText });
      // Show success feedback
      alert('Analysis saved successfully!');
    } catch (err) {
      console.error('Failed to save analysis:', err);
      alert('Failed to save analysis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      alert('Please enter a title for the experiment.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateExperiment(experiment.id, {
        title: editTitle,
        hypothesis: editHypothesis,
        protocol: editProtocol
      });
      setIsEditing(false);
      alert('Experiment updated successfully!');
    } catch (err) {
      console.error('Failed to save experiment:', err);
      alert('Failed to save experiment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    // Reset to original values
    setEditTitle(experiment.title || '');
    setEditHypothesis(experiment.hypothesis || '');
    setEditProtocol(experiment.protocol || '');
    setIsEditing(false);
  };

  const tabs = [
    { name: 'Results & Logs', id: 'logs' },
    { name: 'Protocol', id: 'protocol' },
    { name: 'Analysis & Conclusion', id: 'analysis' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{experiment.id}</p>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1 block w-full text-3xl font-bold text-gray-900 border-0 border-b-2 border-indigo-500 focus:ring-0 focus:border-indigo-600 sm:text-3xl"
              placeholder="Experiment title"
            />
          ) : (
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{experiment.title}</h1>
          )}
        </div>
        <div className="mt-4 flex items-center gap-x-3 md:ml-4 md:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={handleEditCancel}
                disabled={isSaving}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {isOwner && (
                <div className="flex items-center gap-x-2">
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    id="status"
                    value={experiment.status}
                    onChange={handleStatusChange}
                    className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                  >
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Analyzing</option>
                    <option>Completed</option>
                    <option>Failed</option>
                  </select>
                </div>
              )}
              {isOwner ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-x-2"
                    title="Edit experiment"
                  >
                    <IconPencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteExperiment(experiment.id)}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 flex items-center gap-x-2"
                    title="Delete experiment"
                  >
                    <IconTrash className="w-4 h-4" />
                    Delete
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Viewing experiment by {experiment.owner}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {/* --- Tab 1: Results & Logs --- */}
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Log Entry Column */}
            <div className="lg:col-span-2">
              {isOwner ? (
                <form onSubmit={handleAddLog}>
                  <label htmlFor="new-log" className="block text-sm font-medium leading-6 text-gray-900">
                    Add a new log entry
                  </label>
                  <div className="mt-2">
                    <textarea
                      rows={4}
                      id="new-log"
                      value={newLog}
                      onChange={(e) => setNewLog(e.target.value)}
                      className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      placeholder="Log an observation, result, or deviation..."
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Adding...' : 'Add Log'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowUploadModal(true)}
                      className="group flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      <IconPaperClip className="w-5 h-5 mr-1 text-gray-400 group-hover:text-gray-600" />
                      Attach file
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    You are viewing this experiment in read-only mode. Only the owner ({experiment.owner}) can make changes.
                  </p>
                </div>
              )}

              {/* Log Stream */}
              <div className="mt-10">
                <h3 className="text-lg font-semibold text-gray-900">Logbook</h3>
                <ul role="list" className="mt-4 space-y-6">
                  {experiment.logs.map((log, logIdx) => (
                    <li key={logIdx} className="relative flex gap-x-4">
                      <div className={`absolute left-0 top-0 flex w-6 justify-center ${logIdx === experiment.logs.length - 1 ? 'h-6' : '-bottom-6'}`}>
                        <div className="w-px bg-gray-200" />
                      </div>
                      <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ring-1 ring-gray-400" />
                      </div>
                      <div className="flex-auto py-0.5">
                        <p className="text-sm leading-5 text-gray-500">
                          <span className="font-medium text-gray-700">{log.timestamp}</span>
                        </p>
                        <p className="text-sm leading-6 text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>{log.content}</p>
                      </div>
                    </li>
                  ))}
                  {experiment.logs.length === 0 && (
                     <p className="text-sm text-gray-500">No logs have been added yet.</p>
                  )}
                </ul>
              </div>
            </div>

            {/* Files & Metadata Column */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-sm rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900">Attached Files</h3>
                {experiment.files && experiment.files.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {experiment.files.map((file) => (
                      <li 
                        key={file.id} 
                        className="flex items-center justify-between gap-x-2 group"
                      >
                        <button
                          onClick={() => handleFileDownload(file.id)}
                          className="flex items-center gap-x-2 text-sm text-indigo-600 hover:underline cursor-pointer flex-1 min-w-0"
                        >
                          <IconPaperClip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate" title={file.filename}>{file.filename}</span>
                          {file.fileSize && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({formatFileSize(file.fileSize)})
                            </span>
                          )}
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            disabled={isDeletingFile === file.id}
                            className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            title="Delete file"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">No files attached yet.</p>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Upload Files
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* --- Tab 2: Protocol --- */}
        {activeTab === 'protocol' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hypothesis / Objective</h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editHypothesis}
                  onChange={(e) => setEditHypothesis(e.target.value)}
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  placeholder="Enter your hypothesis or objective..."
                />
              ) : (
                <p className="mt-2 text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
                  {experiment.hypothesis || 'No hypothesis entered yet.'}
                </p>
              )}
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Protocol</h3>
              {isEditing ? (
                <textarea
                  rows={12}
                  value={editProtocol}
                  onChange={(e) => setEditProtocol(e.target.value)}
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  placeholder="Enter your protocol steps..."
                />
              ) : (
                <p className="mt-2 text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
                  {experiment.protocol || 'No protocol entered yet.'}
                </p>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleEditCancel}
                  disabled={isSaving}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* --- Tab 3: Analysis --- */}
        {activeTab === 'analysis' && (
          <div className="max-w-3xl">
             <label htmlFor="analysis-text" className="block text-lg font-semibold leading-6 text-gray-900">
              Analysis & Conclusion
            </label>
            <p className="mt-1 text-sm text-gray-500">Summarize your findings and final conclusion here.</p>
            <div className="mt-4">
              <textarea
                rows={15}
                id="analysis-text"
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                disabled={!isOwner}
                className={`block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm ${!isOwner ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={isOwner ? "Start writing your analysis..." : "Only the owner can edit this analysis."}
              />
            </div>
            {isOwner && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleAnalysisSave}
                  disabled={isSaving}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Analysis'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
        experimentId={experiment.id}
      />
    </div>
  );
};

