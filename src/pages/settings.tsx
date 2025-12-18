import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  Select, 
  SelectItem, 
  Switch, 
  Button,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTheme } from '../contexts/theme-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  updatePassword, 
  EmailAuthProvider, 
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup, 
  deleteUser
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    language: i18n.language,
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    marketingEmails: false,
    weeklyReports: true,
    profileVisibility: 'public'
  });
  const getAuthProvider = (): 'password' | 'google' | 'apple' | 'unknown' => {
  if (!user) return 'unknown';
  const providerId = user.providerData[0]?.providerId;
  if (providerId === 'password') return 'password';
  if (providerId === 'google.com') return 'google';
  if (providerId === 'apple.com') return 'apple';
  return 'unknown';
};

const authProvider = getAuthProvider();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
  const loadUserSettings = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings) {
            setSettings(prev => ({  // ✅ Use functional update
              ...prev,
              ...userData.settings,
              language: userData.settings.language || i18n.language
              // ✅ Removed hardcoded 'sq' default
            }));
            
            // Apply saved language if different
            if (userData.settings.language && userData.settings.language !== i18n.language) {
              i18n.changeLanguage(userData.settings.language);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };
  
  loadUserSettings();
}, [user, i18n]); 


  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Simple menu close - just remove the class, don't click anything
    const closeMenu = () => {
      // Remove menu-open class
      document.body.classList.remove('menu-open');
      
      // Hide any open menus by adding a temporary class
      const menus = document.querySelectorAll('.hamburger-menu-panel');
      menus.forEach(menu => {
        if (menu instanceof HTMLElement) {
          menu.style.display = 'none';
          // Allow it to be shown again after a delay
          setTimeout(() => {
            menu.style.display = '';
          }, 500);
        }
      });
    };
    
    // Close immediately
    closeMenu();
    
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Apply theme immediately
    if (key === 'theme') {
      setTheme(value);
    }
    
    try {
      const updateData: any = {};
      
      if (key.includes('Notifications')) {
        updateData['notifications'] = {
          email: newSettings.emailNotifications,
          push: newSettings.pushNotifications,
          sms: newSettings.smsNotifications
        };
      } else {
        updateData[`settings.${key}`] = value;
      }
      
      await updateDoc(doc(db, 'users', user!.uid), updateData);
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('common.error'));
    }
  };
  
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('settings.errors.passwordMismatch'));
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error(t('settings.errors.passwordTooShort'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user!.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user!, credential);
      
      // Update password
      await updatePassword(user!, passwordData.newPassword);
      
      toast.success(t('settings.success.passwordUpdated'));
      onPasswordClose();
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error(t('settings.errors.wrongPassword'));
      } else {
        toast.error(t('settings.errors.passwordUpdateFailed'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (authProvider === 'password' && !deletePassword) {
      toast.error(t('settings.errors.passwordRequired') || 'Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Reauthenticate based on provider
      if (authProvider === 'password') {
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);
      } else if (authProvider === 'google') {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else if (authProvider === 'apple') {
        await reauthenticateWithPopup(user, new OAuthProvider('apple.com'));
      }
      
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      
      toast.success(t('settings.success.accountDeleted'));
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error(t('settings.errors.wrongPassword'));
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Authentication cancelled. Please try again.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in, then try again');
      } else {
        toast.error(t('settings.errors.deleteAccountFailed'));
      }
    } finally {
      setLoading(false);
      setDeletePassword('');
      onDeleteClose();
    }
  };
  
  const handleLanguageChange = async (value: string) => {
    try {
      // Change language first
      await i18n.changeLanguage(value);
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', value);
      
      // Update state
      setSettings(prev => ({ ...prev, language: value }));
      
      // Save to database
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'settings.language': value
        });
      }
      
      // Show success message in the new language
      toast.success(t('common.success'));
      
      // Update HTML lang attribute
      document.documentElement.lang = value;
      
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error(t('common.error'));
    }
  };
  
  const handleThemeChange = (keys: any) => {
    const selectedTheme = Array.from(keys)[0] as string;
    if (selectedTheme && (selectedTheme === 'light' || selectedTheme === 'dark')) {
      // Update theme
      setTheme(selectedTheme as 'light' | 'dark');
      
      // Update setting in database
      updateSetting('theme', selectedTheme);
      
      // Show success toast
      toast.success(t('common.success'));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pt-20" style={{ position: 'relative', zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">{t('nav.settings')}</h1>
        
        {/* Appearance Settings */}
        <Card className="glass-effect mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {t('settings.appearance.title')}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">{t('settings.appearance.theme')}</p>
                  <p className="text-gray-400 text-sm">{t('settings.appearance.themeDescription')}</p>
                </div>
                <Select
                  selectedKeys={[theme]}
                  onSelectionChange={handleThemeChange}
                  className="w-40"
                  variant="bordered"
                  aria-label={t('settings.appearance.toggleTheme')}
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
                  }}
                >
                  <SelectItem key="light" value="light">
                    {t('settings.appearance.light')}
                  </SelectItem>
                  <SelectItem key="dark" value="dark">
                    {t('settings.appearance.dark')}
                  </SelectItem>
                </Select>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">{t('settings.language.title')}</p>
                  <p className="text-gray-400 text-sm">{t('settings.language.select')}</p>
                </div>
                <Select
                  selectedKeys={[settings.language]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) {
                      handleLanguageChange(selected);
                    }
                  }}
                  className="w-40"
                  variant="bordered"
                  aria-label={t('settings.language.select')}
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900"
                  }}
                >
                  <SelectItem key="sq" value="sq">
                    🇦🇱 Shqip
                  </SelectItem>
                  <SelectItem key="en" value="en">
                    🇬🇧 English
                  </SelectItem>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Account Settings */}
        <Card className="glass-effect mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {t('settings.account.title')}
            </h2>
            <div className="space-y-4">
              <Button
                variant="flat"
                color="primary"
                startContent={<Icon icon="lucide:key" />}
                onPress={onPasswordOpen}
                fullWidth
                className="text-white"
              >
                {t('settings.changePassword')}
              </Button>
            </div>
          </CardBody>
        </Card>
        
        {/* Danger Zone */}
        <Card className="border border-danger/50 bg-danger/10">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {t('settings.account.dangerZone')}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {t('settings.account.dangerZoneDescription')}
            </p>
            <Button
              color="danger"
              variant="flat"
              startContent={<Icon icon="lucide:trash-2" />}
              onPress={onDeleteOpen}
              className="text-white"
            >
              {t('settings.deleteAccount')}
            </Button>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Change Password Modal */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose} isDismissable={!loading}>
        <ModalContent>
          <ModalHeader>{t('settings.changePassword')}</ModalHeader>
          <ModalBody>
            <Input
              type="password"
              label={t('settings.currentPassword')}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              variant="bordered"
            />
            <Input
              type="password"
              label={t('settings.newPassword')}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              variant="bordered"
            />
            <Input
              type="password"
              label={t('settings.confirmPassword')}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPasswordClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handlePasswordChange}
              isLoading={loading}
            >
              {t('settings.updatePassword')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isDismissable={!loading}>
        <ModalContent>
          <ModalHeader className="text-danger">{t('settings.deleteAccount')}</ModalHeader>
          <ModalBody>
            <p>{t('settings.deleteConfirmation')}</p>
            <p className="text-gray-400 text-sm mt-2">
              {t('settings.deleteWarning')}
            </p>
            
            {authProvider === 'password' ? (
              <Input
                type="password"
                label={t('settings.currentPassword')}
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                variant="bordered"
                className="mt-4"
              />
            ) : (
              <p className="text-yellow-400 text-sm mt-4">
                You will be asked to sign in with {authProvider === 'google' ? 'Google' : 'Apple'} to confirm.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => {
                setDeletePassword('');
                onDeleteClose();
              }} 
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteAccount}
              isLoading={loading}
              isDisabled={authProvider === 'password' && !deletePassword}
            >
              {t('settings.deleteAccount')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SettingsPage;