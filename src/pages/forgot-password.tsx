import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email is not empty
    if (!email || !email.trim()) {
      toast.error(t('forgotPassword.errors.enterEmail') || 'Please enter your email address', {
        position: 'top-right',
        duration: 3000,
      });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t('forgotPassword.errors.invalidEmail') || 'Please enter a valid email address', {
        position: 'top-right',
        duration: 3000,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email.trim(), {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });
      
      // Success! Show success state
      setEmailSent(true);
      toast.success(t('forgotPassword.success.emailSent') || 'Password reset email sent! Check your inbox.', {
        duration: 4000,
        position: 'top-right',
      });
      
      console.log('Password reset email sent successfully to:', email);
      
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // Handle different error types
      let errorMessage = t('forgotPassword.errors.sendFailed') || 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = t('forgotPassword.errors.userNotFound') || 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = t('forgotPassword.errors.invalidEmail') || 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = t('forgotPassword.errors.sendFailed') || 'Failed to send password reset email. Please try again.';
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right',
      });
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-beamly-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <Icon 
                icon="solar:lock-keyhole-minimalistic-bold-duotone" 
                className="text-beamly-secondary" 
                width={40} 
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">
            {t('forgotPassword.title') || 'Reset Your Password'}
          </h1>
          <p className="text-gray-400 text-lg">
            {t('forgotPassword.subtitle') || "Enter your email and we'll send you instructions to reset your password"}
          </p>
        </div>
        
        {/* Main Card */}
        <Card className="glass-effect border-none">
          <CardBody className="p-8">
            {!emailSent ? (
              /* Form State - Before Email Sent */
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="form-field">
                    <Input
                      type="email"
                      label={t('forgotPassword.emailLabel') || 'Email Address'}
                      placeholder={t('forgotPassword.emailPlaceholder') || 'you@example.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="bordered"
                      size="lg"
                      startContent={
                        <Icon icon="solar:letter-bold-duotone" className="text-gray-400" />
                      }
                      isRequired
                      autoFocus
                      disabled={loading}
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
                    disabled={loading || !email}
                    className="bg-beamly-secondary text-beamly-primary font-semibold"
                  >
                    {loading ? 'Sending...' : (t('forgotPassword.sendButton') || 'Send Reset Instructions')}
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="text-beamly-secondary hover:underline text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Icon icon="solar:arrow-left-line-duotone" />
                    {t('forgotPassword.backToLogin') || 'Back to Login'}
                  </Link>
                </div>
              </>
            ) : (
              /* Success State - After Email Sent */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon 
                      icon="solar:check-circle-bold-duotone" 
                      className="text-green-500" 
                      width={40} 
                    />
                  </div>
                  <h2 className="text-xl font-semibold mb-3">
                    {t('forgotPassword.checkInbox') || 'Check Your Inbox!'}
                  </h2>
                  <p className="text-gray-400 mb-2">
                    {t('forgotPassword.emailSentTo') || "We've sent password reset instructions to:"}
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
                    {t('forgotPassword.returnToLogin') || 'Return to Login'}
                  </Button>
                  
                  <div className="text-gray-400 text-sm">
                    <p className="mb-2">
                      {t('forgotPassword.noEmail') || "Didn't receive the email?"}
                    </p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="text-beamly-secondary hover:underline font-medium"
                    >
                      {t('forgotPassword.tryAgain') || 'Try Again'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>
        
        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {t('forgotPassword.rememberPassword') || 'Remember your password?'}{' '}
            <Link 
              to="/login" 
              className="text-beamly-secondary hover:underline font-medium"
            >
              {t('forgotPassword.signIn') || 'Sign in instead'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;