import React from 'react';

/**
 * A colored tag to show the experiment status.
 */
export const StatusTag = ({ status }) => {
  const styles = {
    'In Progress': 'bg-blue-100 text-blue-800 ring-blue-600/20',
    'Analyzing': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    'Completed': 'bg-green-100 text-green-800 ring-green-600/20',
    'Failed': 'bg-red-100 text-red-800 ring-red-600/20',
    'Planning': 'bg-gray-100 text-gray-800 ring-gray-600/20',
  };
  
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles['Planning']}`}>
      {status}
    </span>
  );
};

