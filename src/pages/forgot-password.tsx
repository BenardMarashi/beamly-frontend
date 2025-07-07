import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { BeamlyLogo } from '../components/beamly-logo';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center relative px-4">
      <div className="blue-accent blue-accent-1"></div>
      <div className="blue-accent blue-accent-2"></div>
      <div className="yellow-accent yellow-accent-1"></div>
      <div className="yellow-accent yellow-accent-2"></div>
      
      <motion.div 
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <BeamlyLogo />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Reset Password
              </h1>
              <p className="text-gray-400">
                {sent 
                  ? 'Check your email for reset instructions'
                  : 'Enter your email to reset your password'
                }
              </p>
            </div>
            
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="john@example.com"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white/5 border-white/20"
                  }}
                  startContent={
                    <Icon icon="lucide:mail" className="text-gray-400" />
                  }
                />
                
                <Button 
                  type="submit"
                  color="secondary" 
                  size="lg"
                  className="w-full font-medium"
                  isLoading={loading}
                  isDisabled={loading}
                >
                  Send Reset Email
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <Icon 
                  icon="lucide:check-circle" 
                  className="text-5xl text-success mx-auto mb-4"
                />
                <p className="text-gray-300 mb-6">
                  We've sent a password reset link to {email}
                </p>
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={() => navigate('/login')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Button
                variant="light"
                startContent={<Icon icon="lucide:arrow-left" />}
                onPress={() => navigate('/login')}
                className="text-gray-400"
              >
                Back to Login
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;