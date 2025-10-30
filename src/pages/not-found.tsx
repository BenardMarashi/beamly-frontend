import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Icon 
            icon="lucide:file-x" 
            className="text-gray-400 mx-auto mb-4" 
            width={120} 
          />
          <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button
              color="primary"
              size="lg"
              startContent={<Icon icon="lucide:home" />}
              onPress={() => navigate('/')}
            >
              Go Home
            </Button>
            <Button
              variant="bordered"
              size="lg"
              startContent={<Icon icon="lucide:arrow-left" />}
              onPress={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-gray-500 text-sm">
            If you believe this is an error, please{' '}
            <a href="/contact" className="text-primary hover:underline">
              contact support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};