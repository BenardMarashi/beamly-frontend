import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12 px-6">
            <div className="mb-6">
              <Icon 
                icon="solar:wallet-bold-duotone" 
                className="text-8xl text-primary mx-auto" 
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Payments</h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Payment functionality is coming soon. You'll be able to manage your 
              transactions, view payment history, and handle billing here.
            </p>
            
            <div className="flex gap-3 justify-center flex-wrap">
              <Button 
                color="primary" 
                onClick={() => navigate('/dashboard')}
                startContent={<Icon icon="solar:home-2-bold-duotone" />}
                size="lg"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="flat"
                onClick={() => navigate(-1)}
                startContent={<Icon icon="solar:arrow-left-line-duotone" />}
                size="lg"
              >
                Go Back
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentsPage;