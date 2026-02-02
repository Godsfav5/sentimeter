/**
 * App Component
 */

import { Routes, Route } from "react-router-dom";
import { Navigation } from "@/components";
import { DashboardPage, HistoryPage } from "@/pages";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
