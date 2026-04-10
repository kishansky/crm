import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Leads from "../pages/Leads";
import SalesTeam from "../pages/SalesTeam";
import Performance from "../pages/Performance";
import LeadDetails from "@/pages/LeadDetails";
import ProtectedRoute from "./ProtectedRoute";
import Status from "@/pages/Status";
import ChangePassword from "@/pages/ChangePassword";
import FollowUp from "@/pages/FollowUp";
import LeadForm from "@/pages/LeadFrom";
import Links from "@/pages/Links";
import ThankYou from "@/pages/ThankYou";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute> } />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/leads/:id" element={<ProtectedRoute><LeadDetails /></ProtectedRoute>} />
        <Route path="/sales-team" element={<ProtectedRoute><SalesTeam /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
        <Route path="/status" element={<ProtectedRoute><Status /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/follow-up" element={<ProtectedRoute><FollowUp /></ProtectedRoute>} />        
        <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />        
        <Route path="/form" element={<LeadForm />} />        
        <Route path="/thank-you" element={<ThankYou />} />        

      </Routes>
    </BrowserRouter>
  );
}