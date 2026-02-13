import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { Mail } from 'lucide-react';

const Messages = () => {
  return (
    <Layout>
      <TopBar
        breadcrumb="Main Menu > Messages"
        title="Messages"
      />

      <div className="crm-card p-12 text-center" data-testid="messages-placeholder">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green-light rounded-2xl mb-4">
          <Mail size={32} className="text-crm-green" />
        </div>
        <h2 className="text-xl font-medium mb-2">Messages Coming Soon</h2>
        <p className="text-crm-text-secondary max-w-md mx-auto">
          Internal messaging and client communication features are being developed.
          Stay tuned for seamless team collaboration tools.
        </p>
      </div>
    </Layout>
  );
};

export default Messages;
