import React, { useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { StatusTag } from '../components/StatusTag';
import { IconClock, IconCheckCircle, IconXCircle } from '../components/icons';

/**
 * The main landing page (Dashboard) - shown after login
 */
export const DashboardPage = ({ experiments, onSelectExperiment, user }) => {
  const stats = useMemo(() => {
    return experiments.reduce((acc, exp) => {
      if (exp.status === 'In Progress') acc.inProgress += 1;
      else if (exp.status === 'Completed') acc.completed += 1;
      else if (exp.status === 'Failed') acc.failed += 1;
      return acc;
    }, { inProgress: 0, completed: 0, failed: 0 });
  }, [experiments]);

  const recentExperiments = [...experiments]
    .sort((a, b) => new Date(b.logs[b.logs.length - 1]?.timestamp || b.startDate) - new Date(a.logs[a.logs.length - 1]?.timestamp || a.startDate))
    .slice(0, 5);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">
        Welcome back, {user?.name ? `${user.name}` : 'User'}!
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={<IconClock className="w-6 h-6" />}
          color={{ bg: 'bg-blue-100', text: 'text-blue-700' }} 
        />
        <StatCard 
          title="Completed" 
          value={stats.completed}
          icon={<IconCheckCircle className="w-6 h-6" />}
          color={{ bg: 'bg-green-100', text: 'text-green-700' }}
        />
        <StatCard 
          title="Failed" 
          value={stats.failed}
          icon={<IconXCircle className="w-6 h-6" />}
          color={{ bg: 'bg-red-100', text: 'text-red-700' }}
        />
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <div className="mt-4 bg-white shadow-sm rounded-lg overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200">
            {recentExperiments.map((exp) => (
              <li 
                key={exp.id} 
                onClick={() => onSelectExperiment(exp)}
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-600 truncate">{exp.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Last log: {exp.logs.length > 0 ? exp.logs[exp.logs.length - 1].content : 'No logs yet'}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <StatusTag status={exp.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

