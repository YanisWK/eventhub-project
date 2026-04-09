import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Participants from "./pages/Participants";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import ProtectedRoute from "./components/protectedRoute";
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";

// Main application router
// Public route : login & protected routes : dashboard, events, participants, event details
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Default route redirects logged-in users to the dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants"
          element={
            <ProtectedRoute>
              <Participants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />

        {/* Route for unknown URL */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
