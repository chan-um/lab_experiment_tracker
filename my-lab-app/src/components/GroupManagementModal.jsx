import React, { useState, useEffect } from 'react';
import { IconXCircle } from './icons';
import { groupsAPI } from '../services/api';

/**
 * Group Management Modal Component
 */
export const GroupManagementModal = ({ isOpen, onClose, onGroupChange }) => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'join', 'members'
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      loadCurrentGroup();
    }
  }, [isOpen]);

  // Reload members when switching to members tab
  useEffect(() => {
    if (isOpen && activeTab === 'members' && currentGroup) {
      loadGroupMembers();
    }
  }, [isOpen, activeTab, currentGroup]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupsAPI.getAll();
      setGroups(response.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentGroup = async () => {
    try {
      const response = await groupsAPI.getCurrent();
      setCurrentGroup(response.group);
      // Load members if there's a current group
      if (response.group) {
        await loadGroupMembers();
      } else {
        setGroupMembers([]);
      }
    } catch (err) {
      console.error('Failed to load current group:', err);
    }
  };

  const loadGroupMembers = async () => {
    try {
      const response = await groupsAPI.getCurrentMembers();
      setGroupMembers(response.members || []);
    } catch (err) {
      console.error('Failed to load group members:', err);
      setGroupMembers([]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await groupsAPI.create(newGroupName.trim());
      await loadGroups();
      await loadCurrentGroup();
      setNewGroupName('');
      setActiveTab('list');
      if (onGroupChange) onGroupChange();
      alert(`Group created! Share code: ${response.group.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Please enter a group code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await groupsAPI.join(joinCode.trim().toUpperCase());
      await loadGroups();
      await loadCurrentGroup();
      setJoinCode('');
      setActiveTab('list');
      if (onGroupChange) onGroupChange();
      alert('Successfully joined group!');
    } catch (err) {
      setError(err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGroup = async (groupId) => {
    try {
      setIsLoading(true);
      await groupsAPI.select(groupId);
      await loadCurrentGroup();
      if (onGroupChange) onGroupChange();
    } catch (err) {
      setError(err.message || 'Failed to select group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setIsLoading(true);
      await groupsAPI.leave(groupId);
      await loadGroups();
      await loadCurrentGroup();
      if (onGroupChange) onGroupChange();
    } catch (err) {
      setError(err.message || 'Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
              Groups
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <IconXCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('list')}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === 'list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                My Groups
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === 'join'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Join
              </button>
              {currentGroup && (
                <button
                  onClick={() => setActiveTab('members')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'members'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Members
                </button>
              )}
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {isLoading && groups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Loading groups...</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">You're not in any groups yet. Create or join one to get started!</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      currentGroup?.id === group.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-x-2">
                        <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                        {currentGroup?.id === group.id && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Code: {group.code} • {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-x-2 ml-4">
                      {currentGroup?.id !== group.id && (
                        <button
                          onClick={() => handleSelectGroup(group.id)}
                          disabled={isLoading}
                          className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={isLoading}
                        className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium leading-6 text-gray-900">
                  Group Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    placeholder="Enter group name"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-medium leading-6 text-gray-900">
                  Group Code
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    required
                    maxLength={6}
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm uppercase"
                    placeholder="Enter 6-character code"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Ask a group member for the join code</p>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Join Group'}
              </button>
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              {!currentGroup ? (
                <p className="text-sm text-gray-500 text-center py-4">No active group selected. Please select a group first.</p>
              ) : (
                <>
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">{currentGroup.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Group Code: {currentGroup.code}</p>
                  </div>
                  
                  {isLoading && groupMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Loading members...</p>
                  ) : groupMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No members found.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        {groupMembers.length} Member{groupMembers.length !== 1 ? 's' : ''}
                      </p>
                      {groupMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-x-3 p-3 rounded-lg border border-gray-200 bg-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                            <span className="text-sm font-semibold text-indigo-600">
                              {member.userName ? member.userName.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.userName || 'Unknown User'}
                            </p>
                            {member.dateJoined && (
                              <p className="text-xs text-gray-500">
                                Joined {new Date(member.dateJoined).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

