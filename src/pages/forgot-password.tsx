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
      toast.success('Password reset email sent!', {
        duration: 1000,
        position: 'top-left',
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address', {
          duration: 1000,
          position: 'top-left',
        });
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address', {
          duration: 1000,
          position: 'top-left',
        });
      } else {
        toast.error('Failed to send password reset email', {
          duration: 1000,
          position: 'top-left',
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-beamly-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <Icon icon="solar:lock-keyhole-minimalistic-bold-duotone" className="text-beamly-secondary" width={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Reset Your Password</h1>
          <p className="text-gray-400 text-lg">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            {!emailSent ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="form-field">
                    <Input
                      type="email"
                      label="Email Address"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="bordered"
                      size="lg"
                      startContent={<Icon icon="solar:letter-bold-duotone" className="text-gray-400" />}
                      isRequired
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                      }}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    color="secondary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    className="bg-beamly-secondary text-beamly-primary font-semibold"
                  >
                    Send Reset Instructions
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="text-beamly-secondary hover:underline text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Icon icon="solar:arrow-left-line-duotone" />
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
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="solar:check-circle-bold-duotone" className="text-green-500" width={40} />
                  </div>
                  <h2 className="text-xl font-semibold mb-3">Check Your Inbox!</h2>
                  <p className="text-gray-400 mb-2">
                    We've sent password reset instructions to:
                  </p>
                  <p className="font-medium text-lg bg-white/5 rounded-lg px-4 py-2 inline-block">
                    {email}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button
                    color="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/login')}
                    className="bg-beamly-secondary text-beamly-primary font-semibold"
                  >
                    Return to Login
                  </Button>
                  
                  <div className="text-gray-400 text-sm">
                    <p className="mb-2">Didn't receive the email?</p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="text-beamly-secondary hover:underline font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-beamly-secondary hover:underline font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;