import React from 'react';
import { IconLayoutDashboard, IconBeaker, IconPlus, IconUserCircle, IconUsers } from './icons';

export const Sidebar = ({ currentPage, onNavigate, onNewExperiment, onLogout, user, onProfileClick, currentGroup, onGroupClick }) => {
  const navItems = [
    { name: 'Dashboard', page: 'dashboard', icon: <IconLayoutDashboard className="w-5 h-5" /> },
    { name: 'All Experiments', page: 'experiments', icon: <IconBeaker className="w-5 h-5" /> },
  ];

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 w-64">
      <div className="flex h-16 shrink-0 items-center">
        {/* Logo */}
        <span className="text-white text-lg font-bold flex items-center">
          <IconBeaker className="w-6 h-6 mr-2 text-indigo-400" />
          LabTrack
        </span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <button
              type="button"
              onClick={onNewExperiment}
              className="w-full flex items-center justify-center gap-x-3 rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <IconPlus className="w-5 h-5" />
              New Experiment
            </button>
          </li>
          <li className="mt-auto">
             <div className="text-xs font-semibold leading-6 text-gray-400">Your Lab</div>
             <ul role="list" className="-mx-2 mt-2 space-y-1">
               {navItems.map((item) => (
                 <li key={item.name}>
                   <a
                     href="#"
                     onClick={(e) => {
                       e.preventDefault();
                       onNavigate(item.page);
                     }}
                     className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                       currentPage === item.page
                         ? 'bg-gray-800 text-white'
                         : 'text-gray-400 hover:text-white hover:bg-gray-800'
                     }`}
                   >
                     {item.icon}
                     {item.name}
                   </a>
                 </li>
               ))}
             </ul>
           </li>
           
          {/* Profile Section */}
          <li className="mt-auto -mx-6 border-t border-gray-800">
            <button
              onClick={onProfileClick}
              className="w-full flex items-center gap-x-4 px-6 py-3 hover:bg-gray-800 transition-colors text-left"
            >
              <IconUserCircle className="h-8 w-8 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-6 text-gray-400 truncate">
                  {user?.name ? `Dr. ${user.name}` : 'Dr. User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@lab.com'}
                </p>
              </div>
            </button>
            <button
              onClick={onGroupClick}
              className="w-full flex items-center gap-x-4 px-6 py-3 hover:bg-gray-800 transition-colors text-left border-t border-gray-800"
            >
              <IconUsers className="h-8 w-8 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-6 text-gray-400 truncate">
                  Group
                </p>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-x-4 px-6 py-3 hover:bg-red-900/20 transition-colors text-left border-t border-gray-800"
            >
              <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-6 text-red-400 truncate">
                  Sign Out
                </p>
              </div>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

