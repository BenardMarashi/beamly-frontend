import React from "react";
import { redirectToCheckout } from '../lib/payments';

export const BillingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Billing & Payments</h1>
      <div className="glass-effect p-6">
        <p className="text-white">Billing and payment information will appear here.</p>
      </div>
    </div>
  );
};

export default BillingPage;