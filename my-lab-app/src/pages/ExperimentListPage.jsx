import React, { useState, useMemo } from 'react';
import { StatusTag } from '../components/StatusTag';
import { IconSearch, IconTrash } from '../components/icons';

/**
 * The "All Experiments" list page with filtering
 */
export const ExperimentListPage = ({ experiments, onSelectExperiment, onDeleteExperiment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  const owners = useMemo(() => ['All', ...new Set(experiments.map(e => e.owner))], [experiments]);
  const [ownerFilter, setOwnerFilter] = useState('All');

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || exp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || exp.status === statusFilter;
      const matchesOwner = ownerFilter === 'All' || exp.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [experiments, searchTerm, statusFilter, ownerFilter]);

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">All Experiments</h1>
        {/* The "New Experiment" button would live in the sidebar, but one could be here too */}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Search */}
        <div className="relative rounded-md shadow-sm col-span-1 md:col-span-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            placeholder="Search by title or ID..."
          />
        </div>
        
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="sr-only">Filter by status</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          >
            <option>All Statuses</option>
            <option>Planning</option>
            <option>In Progress</option>
            <option>Analyzing</option>
            <option>Completed</option>
            <option>Failed</option>
          </select>
        </div>

        {/* Owner Filter */}
        <div>
          <label htmlFor="owner" className="sr-only">Filter by owner</label>
          <select
            id="owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          >
            {owners.map(owner => <option key={owner}>{owner}</option>)}
          </select>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Owner</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Date</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredExperiments.length > 0 ? (
                    filteredExperiments.map((exp) => (
                      <tr 
                        key={exp.id} 
                        className="hover:bg-gray-50 group"
                      >
                        <td 
                          onClick={() => onSelectExperiment(exp)}
                          className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 cursor-pointer"
                        >
                          {exp.id}
                        </td>
                        <td 
                          onClick={() => onSelectExperiment(exp)}
                          className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 max-w-xs truncate cursor-pointer"
                        >
                          {exp.title}
                        </td>
                        <td 
                          onClick={() => onSelectExperiment(exp)}
                          className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 cursor-pointer"
                        >
                          <StatusTag status={exp.status} />
                        </td>
                        <td 
                          onClick={() => onSelectExperiment(exp)}
                          className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 cursor-pointer"
                        >
                          {exp.owner}
                        </td>
                        <td 
                          onClick={() => onSelectExperiment(exp)}
                          className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 cursor-pointer"
                        >
                          {exp.startDate}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteExperiment(exp.id);
                            }}
                            className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete experiment"
                          >
                            <IconTrash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                        {experiments.length === 0 
                          ? 'No experiments yet. Create your first experiment to get started!'
                          : 'No experiments match your filters. Try adjusting your search or filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

