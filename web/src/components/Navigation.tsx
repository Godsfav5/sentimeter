/**
 * Navigation Component
 */

import { NavLink } from "react-router-dom";

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-primary-600" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="currentColor" />
                <path
                  d="M30 60 L45 45 L55 55 L70 35"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900">Sentimeter</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                History
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
