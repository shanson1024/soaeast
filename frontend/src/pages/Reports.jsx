import React from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <Layout>
      <TopBar
        breadcrumb="Main Menu > Reports"
        title="Reports"
      />

      <div className="crm-card p-12 text-center" data-testid="reports-placeholder">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crm-green-light rounded-2xl mb-4">
          <BarChart3 size={32} className="text-crm-green" />
        </div>
        <h2 className="text-xl font-medium mb-2">Reports Coming Soon</h2>
        <p className="text-crm-text-secondary max-w-md mx-auto">
          Advanced analytics and reporting features are being developed. 
          Check back soon for detailed insights into your sales performance.
        </p>
      </div>
    </Layout>
  );
};

export default Reports;
