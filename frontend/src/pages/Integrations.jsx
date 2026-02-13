import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Monitor } from 'lucide-react';

const Integrations = () => {
  return (
    <Layout>
      <TopBar
        breadcrumb="Management > Integrations"
        title="Integrations"
      />

      <div className="crm-card p-12 text-center" data-testid="integrations-placeholder">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green-light rounded-2xl mb-4">
          <Monitor size={32} className="text-crm-green" />
        </div>
        <h2 className="text-xl font-medium mb-2">Integrations Hub Coming Soon</h2>
        <p className="text-crm-text-secondary max-w-md mx-auto">
          Third-party integrations and API connections are being developed.
          Connect your favorite tools and services seamlessly.
        </p>
      </div>
    </Layout>
  );
};

export default Integrations;
