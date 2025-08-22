// src/pages/client/payment.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { JobPayment } from '../../components/payments/JobPayment';
import toast from 'react-hot-toast';

export const ClientPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Get proposal data from navigation state
  const proposalData = location.state as {
    proposalId: string;
    jobId: string;
    jobTitle: string;
    freelancerId: string;
    freelancerName: string;
    amount: number;
    budgetType: string;
  };

  useEffect(() => {
    // Verify client access and proposal data
    if (!user || (userData?.userType !== 'client' && userData?.userType !== 'both')) {
      navigate('/dashboard');
      return;
    }
    
    if (!proposalData) {
      toast.error(t('payment.errors.invalidRequest'));
      navigate('/client/proposals');
      return;
    }
  }, [user, userData, proposalData]);

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    toast.success(t('payment.success.paymentSuccessful'));
    
    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/client/proposals');
  };

  if (!proposalData) {
    return null;
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-green-500/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Icon icon="lucide:check" className="text-4xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('payment.paymentSuccessful')}</h2>
          <p className="text-gray-400 mb-6">
            {t('payment.fundsInEscrow')}
          </p>
          <Button
            color="primary"
            onPress={() => navigate('/dashboard')}
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            {t('payment.backToDashboard')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <Button
            variant="light"
            onPress={() => navigate('/client/proposals')}
            startContent={<Icon icon="lucide:arrow-left" />}
            className="mb-4"
          >
            {t('payment.backToProposals')}
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">{t('payment.completePayment')}</h1>
          <p className="text-gray-400">
            {t('payment.acceptProposal', { jobTitle: proposalData.jobTitle })}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <JobPayment
            jobId={proposalData.jobId}
            proposalId={proposalData.proposalId}
            freelancerName={proposalData.freelancerName}
            amount={proposalData.amount}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
          
          <Card className="glass-effect border-none mt-6">
            <CardBody>
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">{t('payment.howItWorks')}</h4>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>{t('payment.steps.step1')}</li>
                    <li>{t('payment.steps.step2')}</li>
                    <li>{t('payment.steps.step3')}</li>
                    <li>{t('payment.steps.step4')}</li>
                  </ol>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientPaymentPage;