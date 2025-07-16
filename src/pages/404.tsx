import React from 'react';
import { Button, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl w-full">
          <CardBody className="text-center py-12 px-6">
            <div className="mb-6">
              <Icon 
                icon="solar:ghost-bold-duotone" 
                className="text-9xl text-primary mx-auto animate-bounce" 
              />
            </div>
            
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Oops! The page you're looking for seems to have vanished into thin air. 
              It might have been moved, deleted, or perhaps it never existed.
            </p>
            
            <div className="flex gap-3 justify-center flex-wrap">
              <Button 
                color="primary" 
                onClick={() => navigate('/')}
                startContent={<Icon icon="solar:home-2-bold-duotone" />}
                size="lg"
              >
                Go Home
              </Button>
              <Button 
                variant="flat"
                onClick={() => navigate(-1)}
                startContent={<Icon icon="solar:arrow-left-line-duotone" />}
                size="lg"
              >
                Go Back
              </Button>
              <Button 
                variant="flat"
                onClick={() => navigate('/help')}
                startContent={<Icon icon="solar:question-circle-bold-duotone" />}
                size="lg"
              >
                Get Help
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-default-200">
              <p className="text-sm text-gray-500 mb-4">
                Here are some helpful links:
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a 
                  onClick={() => navigate('/browse-jobs')}
                  className="text-primary hover:underline cursor-pointer text-sm"
                >
                  Browse Jobs
                </a>
                <a 
                  onClick={() => navigate('/browse-freelancers')}
                  className="text-primary hover:underline cursor-pointer text-sm"
                >
                  Find Freelancers
                </a>
                <a 
                  onClick={() => navigate('/dashboard')}
                  className="text-primary hover:underline cursor-pointer text-sm"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;