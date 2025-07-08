import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Switch, Select, SelectItem, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  
  const [settings, setSettings] = useState({
    emailNotifications: userData?.notifications?.email ?? true,
    pushNotifications: userData?.notifications?.push ?? true,
    smsNotifications: userData?.notifications?.sms ?? false,
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    timezone: 'UTC',
    language: 'en'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];
  
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' }
  ];
  
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
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
        
        {/* Notification Settings */}
        <Card className="glass-effect border-none mb-6">
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
                  <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                </div>
                <Switch
                  isSelected={settings.pushNotifications}
                  onValueChange={(value) => updateSetting('pushNotifications', value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                </div>
                <Switch
                  isSelected={settings.smsNotifications}
                  onValueChange={(value) => updateSetting('smsNotifications', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Privacy Settings */}
        <Card className="glass-effect border-none mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Privacy</h2>
            <div className="space-y-4">
              <Select
                label="Profile Visibility"
                selectedKeys={[settings.profileVisibility]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateSetting('profileVisibility', value);
                }}
                variant="bordered"
                className="text-white"
              >
                <SelectItem key="public" value="public">Public</SelectItem>
                <SelectItem key="clients-only" value="clients-only">Clients Only</SelectItem>
                <SelectItem key="private" value="private">Private</SelectItem>
              </Select>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Show Email on Profile</p>
                  <p className="text-gray-400 text-sm">Allow others to see your email</p>
                </div>
                <Switch
                  isSelected={settings.showEmail}
                  onValueChange={(value) => updateSetting('showEmail', value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Show Phone on Profile</p>
                  <p className="text-gray-400 text-sm">Allow others to see your phone number</p>
                </div>
                <Switch
                  isSelected={settings.showPhone}
                  onValueChange={(value) => updateSetting('showPhone', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* General Settings */}
        <Card className="glass-effect border-none mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">General</h2>
            <div className="space-y-4">
              <Select
                label="Timezone"
                selectedKeys={[settings.timezone]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateSetting('timezone', value);
                }}
                variant="bordered"
                className="text-white"
              >
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                label="Language"
                selectedKeys={[settings.language]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateSetting('language', value);
                }}
                variant="bordered"
                className="text-white"
              >
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>
        
        {/* Account Settings */}
        <Card className="glass-effect border-none">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <div className="space-y-4">
              <Button
                color="primary"
                variant="flat"
                fullWidth
                startContent={<Icon icon="lucide:lock" />}
                onClick={onPasswordOpen}
              >
                Change Password
              </Button>
              
              <Divider />
              
              <div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Icon icon="lucide:trash-2" />}
                  onClick={onDeleteOpen}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Change Password Modal */}
        <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
          <ModalContent>
            <ModalHeader>Change Password</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
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
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onPasswordClose}>
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
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader className="text-red-400">Delete Account</ModalHeader>
            <ModalBody>
              <p className="text-gray-300">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                All your data, including jobs, proposals, and contracts will be permanently deleted.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
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
      </motion.div>
    </div>
  );
};

export default SettingsPage;