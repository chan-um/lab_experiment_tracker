import React from 'react';

/**
 * A card for showing quick stats on the dashboard.
 */
export const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white shadow-sm rounded-lg p-5">
    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color.bg} ${color.text}`}>
      {icon}
    </div>
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

