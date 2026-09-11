import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.scss'
import HeaderLayout from './shared/layout/header';
import NotFound from './pages/not_found';
import RegistrationRequest from './pages/registration_request';
import UserAccessManagement from './pages/user_access';
import EnvironmentManagement from './pages/environment';
import DmsManagement from './pages/dms_management';
import ConfigurationManagement from './pages/configuration_management';
import AccessManagement from './pages/access_management';
import Support from './pages/support';
import PlanManagement from './pages/plan';
import ComponentManagement from './pages/component';
import BillingManagement from './pages/billing';

const App: React.FC = () => {
const basename = import.meta.env.VITE_BASE_URL || '/';

  return (
    <Router basename={basename}>
      <HeaderLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/reg-request" />} />
          <Route path="/reg-request" element={<RegistrationRequest />} />
          <Route path="/user-access" element={<UserAccessManagement />} />
          <Route path="/env" element={<EnvironmentManagement />} />
          <Route path="/dms" element={<DmsManagement />} />
          <Route path="/config" element={<ConfigurationManagement />} />
          <Route path="/plan" element={<PlanManagement />} />
          <Route path="/component" element={<ComponentManagement />} />
          <Route path="/billing" element={<BillingManagement />} />
          <Route path="/access" element={<AccessManagement />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HeaderLayout>
    </Router>
  )
}

export default App
