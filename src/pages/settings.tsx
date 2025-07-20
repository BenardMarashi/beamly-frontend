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
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
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
  
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    marketingEmails: false,
    weeklyReports: true,
    profileVisibility: 'public'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
// In your settings.tsx file, replace the first useEffect with this simpler version:

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
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };
  
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
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
      
      toast.success('Password updated successfully');
      onPasswordClose();
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    setLoading(true);
    
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user!.uid));
      
      // Delete the user account
      await deleteUser(user!);
      
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try logging in again.');
    } finally {
      setLoading(false);
      onDeleteClose();
    }
  };
  
  const handleLanguageChange = (value: string) => {
    updateSetting('language', value);
    i18n.changeLanguage(value);
  };
  
  const handleThemeChange = (keys: any) => {
    const selectedTheme = Array.from(keys)[0] as string;
    if (selectedTheme && (selectedTheme === 'light' || selectedTheme === 'dark')) {
      // Update theme
      setTheme(selectedTheme as 'light' | 'dark');
      
      // Update setting in database
      updateSetting('theme', selectedTheme);
      
      // Show success toast
      toast.success(`Theme changed to ${selectedTheme}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pt-20" style={{ position: 'relative', zIndex: 100 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">{t('settings.title')}</h1>
        
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
                  <p className="text-gray-400 text-sm">Choose your preferred theme</p>
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
                  onSelectionChange={(keys) => handleLanguageChange(Array.from(keys)[0] as string)}
                  className="w-40"
                  variant="bordered"
                  aria-label={t('settings.language.select')}
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
                  }}
                >
                  <SelectItem key="en" value="en">
                    {t('settings.language.english')}
                  </SelectItem>
                  <SelectItem key="sq" value="sq">
                    {t('settings.language.albanian')}
                  </SelectItem>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Notification Settings */}
        <Card className="glass-effect mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive email notifications</p>
                </div>
                <Switch
                  isSelected={settings.emailNotifications}
                  onValueChange={(value) => updateSetting('emailNotifications', value)}
                />
              </div>
              <Divider className="my-4" />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive push notifications</p>
                </div>
                <Switch
                  isSelected={settings.pushNotifications}
                  onValueChange={(value) => updateSetting('pushNotifications', value)}
                />
              </div>
              <Divider className="my-4" />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Marketing Emails</p>
                  <p className="text-gray-400 text-sm">Receive marketing and promotional emails</p>
                </div>
                <Switch
                  isSelected={settings.marketingEmails}
                  onValueChange={(value) => updateSetting('marketingEmails', value)}
                />
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
              >
                Change Password
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
            >
              {t('settings.account.deleteAccount')}
            </Button>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Change Password Modal */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose} isDismissable={!loading}>
        <ModalContent>
          <ModalHeader>Change Password</ModalHeader>
          <ModalBody>
            <Input
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              variant="bordered"
            />
            <Input
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              variant="bordered"
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPasswordClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handlePasswordChange}
              isLoading={loading}
            >
              Update Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isDismissable={!loading}>
        <ModalContent>
          <ModalHeader className="text-danger">Delete Account</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p className="text-gray-400 text-sm mt-2">
              All your data, including jobs, proposals, and messages will be permanently deleted.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteAccount}
              isLoading={loading}
            >
              Delete Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SettingsPage;