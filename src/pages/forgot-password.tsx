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
    
    if (!email) {
      toast.error(t('forgotPassword.errors.enterEmail'));
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success(t('forgotPassword.success.emailSent'), {
        duration: 1000,
        position: 'top-left',
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error(t('forgotPassword.errors.userNotFound'), {
          duration: 1000,
          position: 'top-left',
        });
      } else if (error.code === 'auth/invalid-email') {
        toast.error(t('forgotPassword.errors.invalidEmail'), {
          duration: 1000,
          position: 'top-left',
        });
      } else {
        toast.error(t('forgotPassword.errors.sendFailed'), {
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
          <h1 className="text-3xl font-bold mb-3">{t('forgotPassword.title')}</h1>
          <p className="text-gray-400 text-lg">
            {t('forgotPassword.subtitle')}
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
                      label={t('forgotPassword.emailLabel')}
                      placeholder={t('forgotPassword.emailPlaceholder')}
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
                    {t('forgotPassword.sendButton')}
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="text-beamly-secondary hover:underline text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Icon icon="solar:arrow-left-line-duotone" />
                    {t('forgotPassword.backToLogin')}
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
                  <h2 className="text-xl font-semibold mb-3">{t('forgotPassword.checkInbox')}</h2>
                  <p className="text-gray-400 mb-2">
                    {t('forgotPassword.emailSentTo')}
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
                    {t('forgotPassword.returnToLogin')}
                  </Button>
                  
                  <div className="text-gray-400 text-sm">
                    <p className="mb-2">{t('forgotPassword.noEmail')}</p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="text-beamly-secondary hover:underline font-medium"
                    >
                      {t('forgotPassword.tryAgain')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </CardBody>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {t('forgotPassword.rememberPassword')}{' '}
            <Link to="/login" className="text-beamly-secondary hover:underline font-medium">
              {t('forgotPassword.signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;