import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProfileEditModal } from './components/ProfileEditModal';
import { GroupManagementModal } from './components/GroupManagementModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExperimentListPage } from './pages/ExperimentListPage';
import { NewExperimentPage } from './pages/NewExperimentPage';
import { ExperimentDetailPage } from './pages/ExperimentDetailPage';
import { authAPI, experimentsAPI, groupsAPI } from './services/api';

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);

  // App state
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'experiments', 'new', 'detail'
  const [experiments, setExperiments] = useState([]); // User's experiments (for dashboard)
  const [groupExperiments, setGroupExperiments] = useState([]); // Group experiments (for experiments list page)
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.user);
        setIsAuthenticated(true);
        await loadCurrentGroup();
        await loadExperiments();
      } catch (err) {
        // No active session
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Load current group
  const loadCurrentGroup = async () => {
    try {
      const response = await groupsAPI.getCurrent();
      setCurrentGroup(response.group);
    } catch (err) {
      console.error('Failed to load current group:', err);
      setCurrentGroup(null);
    }
  };

  // Load experiments from API
  const loadExperiments = async () => {
    try {
      // Load user's experiments (for dashboard)
      const userExps = await experimentsAPI.getAll('user');
      setExperiments(userExps);
      
      // Load group experiments (for experiments list page)
      const groupExps = await experimentsAPI.getAll('group');
      setGroupExperiments(groupExps);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    }
  };

  // Handle group changes
  const handleGroupChange = async () => {
    await loadCurrentGroup();
    await loadExperiments();
  };

  const handleLogin = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLogin(false);
    setCurrentPage('dashboard');
    await loadExperiments();
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setUser(null);
    setSelectedExperiment(null);
    setExperiments([]);
    setGroupExperiments([]);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => {
    setSelectedExperiment(null); // Clear selected experiment when navigating away
    setCurrentPage(page);
  };

  const handleSelectExperiment = async (experiment) => {
    try {
      // Fetch latest version from API
      const updatedExp = await experimentsAPI.getById(experiment.id);
      setSelectedExperiment(updatedExp);
      setCurrentPage('detail');
    } catch (err) {
      console.error('Failed to load experiment:', err);
      // Fallback to local data
    setSelectedExperiment(experiment);
    setCurrentPage('detail');
    }
  };
  
  const handleAddExperiment = async (newExperiment) => {
    try {
      const created = await experimentsAPI.create(newExperiment);
      setExperiments([created, ...experiments]);
      // Also add to group experiments if user is in a group
      setGroupExperiments(prev => {
        // Check if experiment already exists to avoid duplicates
        const exists = prev.find(exp => exp.id === created.id);
        return exists ? prev : [created, ...prev];
      });
      setSelectedExperiment(created);
      setCurrentPage('detail');
    } catch (err) {
      console.error('Failed to create experiment:', err);
      alert('Failed to create experiment. Please try again.');
    }
  };
  
  const handleUpdateExperiment = async (id, updatesOrExperiment) => {
    try {
      // Check if updatesOrExperiment is a full experiment object (from addLog) or updates object
      const isFullExperiment = updatesOrExperiment && updatesOrExperiment.id && updatesOrExperiment.logs;
      
      let updated;
      if (isFullExperiment) {
        // It's already a full experiment object (from addLog API)
        updated = updatesOrExperiment;
      } else {
        // It's an updates object, call the API
        updated = await experimentsAPI.update(id, updatesOrExperiment);
      }
      
    setExperiments(prevExperiments =>
      prevExperiments.map(exp => 
          exp.id === id ? updated : exp
        )
      );
    // Also update in group experiments if it exists there
    setGroupExperiments(prevExperiments =>
      prevExperiments.map(exp => 
          exp.id === id ? updated : exp
        )
      );
      // Update the selected experiment as well
      if (selectedExperiment && selectedExperiment.id === id) {
        setSelectedExperiment(updated);
      }
    } catch (err) {
      console.error('Failed to update experiment:', err);
      alert('Failed to update experiment. Please try again.');
    }
  };

  const handleDeleteExperiment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      await experimentsAPI.delete(id);
      // Remove from user's experiments list
      setExperiments(prevExperiments => prevExperiments.filter(exp => exp.id !== id));
      // Remove from group experiments list
      setGroupExperiments(prevExperiments => prevExperiments.filter(exp => exp.id !== id));
      // If the deleted experiment was selected, navigate away
    if (selectedExperiment && selectedExperiment.id === id) {
        setSelectedExperiment(null);
        setCurrentPage('dashboard');
      }
    } catch (err) {
      console.error('Failed to delete experiment:', err);
      alert('Failed to delete experiment. Please try again.');
    }
  };

  const handleProfileUpdate = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      setUser(response.user);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const renderPage = () => {
    if (currentPage === 'detail' && selectedExperiment) {
      return <ExperimentDetailPage 
                experiment={selectedExperiment}
                onUpdateExperiment={handleUpdateExperiment}
                onDeleteExperiment={handleDeleteExperiment}
                onNavigate={handleNavigate}
                user={user}
              />;
    }
    if (currentPage === 'experiments') {
      return <ExperimentListPage 
                experiments={groupExperiments}
                onSelectExperiment={handleSelectExperiment}
                onDeleteExperiment={handleDeleteExperiment}
              />;
    }
    if (currentPage === 'new') {
      return <NewExperimentPage 
                onAddExperiment={handleAddExperiment}
                onCancel={() => handleNavigate('dashboard')}
              />;
    }
    // Default to dashboard
    return <DashboardPage 
              experiments={experiments}
              onSelectExperiment={handleSelectExperiment}
              user={user}
            />;
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated and not showing login
  if (!isAuthenticated && !showLogin) {
    return <LandingPage onNavigateToLogin={() => setShowLogin(true)} />;
  }

  // Show login page if not authenticated but login requested
  if (!isAuthenticated && showLogin) {
    return (
      <LoginPage 
        onLogin={handleLogin}
        onBackToHome={() => setShowLogin(false)}
      />
    );
  }

  // Show main app if authenticated
  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onNewExperiment={() => setCurrentPage('new')}
        onLogout={handleLogout}
        user={user}
        onProfileClick={() => setShowProfileModal(true)}
        currentGroup={currentGroup}
        onGroupClick={() => setShowGroupModal(true)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />

      {/* Group Management Modal */}
      <GroupManagementModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupChange={handleGroupChange}
      />
    </div>
  );
}
