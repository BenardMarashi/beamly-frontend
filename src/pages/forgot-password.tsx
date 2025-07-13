import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else {
        toast.error('Failed to send password reset email');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">
            No worries! We'll send you reset instructions.
          </p>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            {!emailSent ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="email"
                      label="Email Address"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="bordered"
                      className="text-white"
                      startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                      isRequired
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                  >
                    Send Reset Instructions
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="text-primary hover:underline text-sm flex items-center justify-center gap-2"
                  >
                    <Icon icon="lucide:arrow-left" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="lucide:mail-check" className="text-primary" width={40} />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
                  <p className="text-gray-400">
                    We've sent password reset instructions to:
                  </p>
                  <p className="text-white font-medium mt-2">{email}</p>
                </div>
                
                <div className="space-y-4">
                  <Button
                    color="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                  
                  <p className="text-gray-400 text-sm">
                    Didn't receive the email?{' '}
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        handleSubmit(new Event('submit') as any);
                      }}
                      className="text-primary hover:underline"
                    >
                      Click to resend
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;