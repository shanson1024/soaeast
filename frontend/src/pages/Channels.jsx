import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Globe } from 'lucide-react';

const Channels = () => {
  return (
    <Layout>
      <TopBar
        breadcrumb="Customers > Channels"
        title="Sales Channels"
      />

      <div className="crm-card p-12 text-center" data-testid="channels-placeholder">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green-light rounded-2xl mb-4">
          <Globe size={32} className="text-crm-green" />
        </div>
        <h2 className="text-xl font-medium mb-2">Channels Coming Soon</h2>
        <p className="text-crm-text-secondary max-w-md mx-auto">
          Multi-channel sales tracking and management features are being developed.
          Connect and monitor all your sales channels in one place.
        </p>
      </div>
    </Layout>
  );
};

export default Channels;
