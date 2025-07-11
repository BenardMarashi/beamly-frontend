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
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
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
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
                  onSelectionChange={(keys) => setTheme(Array.from(keys)[0] as any)}
                  className="w-40"
                  variant="bordered"
                  aria-label={t('settings.appearance.toggleTheme')}
                >
                  <SelectItem key="light" value="light">
                    {t('settings.appearance.light')}
                  </SelectItem>
                  <SelectItem key="dark" value="dark">
                    {t('settings.appearance.dark')}
                  </SelectItem>
                  <SelectItem key="system" value="system">
                    {t('settings.appearance.system')}
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
                  <p className="text-gray-400 text-sm">Receive notifications via email</p>
                </div>
                <Switch
                  isSelected={settings.emailNotifications}
                  onValueChange={(value) => updateSetting('emailNotifications', value)}
                />
              </div>
              
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
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive SMS notifications</p>
                </div>
                <Switch
                  isSelected={settings.smsNotifications}
                  onValueChange={(value) => updateSetting('smsNotifications', value)}
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
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Weekly Reports</p>
                  <p className="text-gray-400 text-sm">Receive weekly activity reports</p>
                </div>
                <Switch
                  isSelected={settings.weeklyReports}
                  onValueChange={(value) => updateSetting('weeklyReports', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Privacy Settings */}
        <Card className="glass-effect mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Privacy</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Profile Visibility</p>
                  <p className="text-gray-400 text-sm">Control who can see your profile</p>
                </div>
                <Select
                  selectedKeys={[settings.profileVisibility]}
                  onSelectionChange={(keys) => updateSetting('profileVisibility', Array.from(keys)[0])}
                  className="w-40"
                  variant="bordered"
                >
                  <SelectItem key="public" value="public">Public</SelectItem>
                  <SelectItem key="clients-only" value="clients-only">Clients Only</SelectItem>
                  <SelectItem key="private" value="private">Private</SelectItem>
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
              >
                Change Password
              </Button>
              
              <Button
                variant="flat"
                color="warning"
                startContent={<Icon icon="lucide:download" />}
                fullWidth
              >
                Download Account Data
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