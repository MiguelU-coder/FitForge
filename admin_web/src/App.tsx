import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import axios from 'axios'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import OrganizationDashboard from './pages/OrganizationDashboard'
import OrganizationMembers from './pages/OrganizationMembers'
import OrganizationRoutines from './pages/OrganizationRoutines'
import OrganizationPayments from './pages/OrganizationPayments'
import OrganizationSettings from './pages/OrganizationSettings'
import AddMember from './pages/AddMember'
import MemberDetail from './pages/MemberDetail'
import AddPayment from './pages/AddPayment'
import UserManagement from './pages/UserManagement';
import AddUser from './pages/AddUser';
import Organizations from './pages/Organizations';
import MembershipAdmin from './pages/MembershipAdmin';
import PlatformRevenue from './pages/PlatformRevenue';
import SecurityAudit from './pages/SecurityAudit';
import SupportHub from './pages/SupportHub';
import PlanConfiguration from './pages/PlanConfiguration';
import AddOrganization from './pages/AddOrganization';
import EditOrganization from './pages/EditOrganization';
import DashboardLayout from './components/layout/DashboardLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (session: any) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/me`, {}, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setProfile(data.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session);
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session);
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #10b98133', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!session ? <Register /> : <Navigate to="/" />} 
        />
        <Route
          path="/"
          element={
            session ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                {profile?.isGlobalAdmin ? (
                  <Dashboard session={session} profile={profile} />
                ) : (
                  <OrganizationDashboard session={session} profile={profile} />
                )}
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Organization Admin Routes */}
        <Route
          path="/members"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <OrganizationMembers session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/routines"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <OrganizationRoutines session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/payments"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <OrganizationPayments session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/gym-settings"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <OrganizationSettings session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/members/add"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <AddMember session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/members/:memberId"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <MemberDetail session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/payments/new"
          element={
            session && !profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <AddPayment session={session} profile={profile} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Global Admin Routes */}
        <Route 
          path="/users" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <UserManagement session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/users/add" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <AddUser session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/organizations" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <Organizations session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/organizations/add" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <AddOrganization session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/organizations/:id/edit" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <EditOrganization session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/membership" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <MembershipAdmin session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/revenue" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <PlatformRevenue session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/security" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <SecurityAudit session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/support" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <SupportHub session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/billing/plans" 
          element={
            session && profile?.isGlobalAdmin ? (
              <DashboardLayout user={{ ...session.user, ...profile }}>
                <PlanConfiguration session={session} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
