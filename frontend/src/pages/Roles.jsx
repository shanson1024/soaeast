import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Shield } from 'lucide-react';

const Roles = () => {
  return (
    <Layout>
      <TopBar
        breadcrumb="Management > Roles"
        title="User Roles"
      />

      <div className="crm-card p-12 text-center" data-testid="roles-placeholder">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green-light rounded-2xl mb-4">
          <Shield size={32} className="text-crm-green" />
        </div>
        <h2 className="text-xl font-medium mb-2">Role Management Coming Soon</h2>
        <p className="text-crm-text-secondary max-w-md mx-auto">
          User roles and permission management features are being developed.
          Define custom roles and access levels for your team.
        </p>
      </div>
    </Layout>
  );
};

export default Roles;
