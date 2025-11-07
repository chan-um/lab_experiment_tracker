import React from 'react';
import { IconBeaker } from '../components/icons';

/**
 * Landing page shown before login
 */
export const LandingPage = ({ onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconBeaker className="w-8 h-8 text-indigo-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">LabTrack</span>
            </div>
            <button
              onClick={onNavigateToLogin}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
            Track Your Experiments
            <span className="text-indigo-600"> with Confidence</span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
            A comprehensive lab notebook solution for researchers. Document protocols, log observations, 
            analyze results, and collaborate with your team—all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={onNavigateToLogin}
              className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get Started
            </button>
            <button
              className="text-base font-semibold leading-6 text-gray-900 hover:text-indigo-600"
            >
              Learn More <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <IconBeaker className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Organized Experiments</h3>
              <p className="mt-2 text-sm text-gray-600">
                Keep all your experiments organized with detailed protocols, hypotheses, and status tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Real-time Logging</h3>
              <p className="mt-2 text-sm text-gray-600">
                Log observations, results, and deviations as they happen with timestamped entries.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Data Analysis</h3>
              <p className="mt-2 text-sm text-gray-600">
                Analyze your results and draw conclusions with built-in analysis tools and reporting.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 LabTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

