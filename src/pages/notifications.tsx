import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Switch } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'job_posted' | 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'message' | 'payment_received';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  link?: string;
  icon?: string;
  color?: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    email: userData?.notifications?.email ?? true,
    push: userData?.notifications?.push ?? true,
    sms: userData?.notifications?.sms ?? false
  });
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchNotifications();
    }
  }, [user, navigate]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notificationsData: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp()
        });
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };
  
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };
  
  const updateNotificationSettings = async (setting: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(newSettings);
    
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        notifications: newSettings
      });
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
        return 'lucide:briefcase';
      case 'proposal_received':
      case 'proposal_accepted':
      case 'proposal_rejected':
        return 'lucide:file-text';
      case 'message':
        return 'lucide:message-square';
      case 'payment_received':
        return 'lucide:dollar-sign';
      default:
        return 'lucide:bell';
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'proposal_accepted':
      case 'payment_received':
        return 'success';
      case 'proposal_rejected':
        return 'danger';
      case 'message':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <Button
              color="primary"
              variant="flat"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {/* Notification Settings */}
        <Card className="glass-effect border-none mb-6">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via email</p>
                </div>
                <Switch
                  isSelected={notificationSettings.email}
                  onValueChange={(value) => updateNotificationSettings('email', value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                </div>
                <Switch
                  isSelected={notificationSettings.push}
                  onValueChange={(value) => updateNotificationSettings('push', value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                </div>
                <Switch
                  isSelected={notificationSettings.sms}
                  onValueChange={(value) => updateNotificationSettings('sms', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Notifications List */}
        <Card className="glass-effect border-none">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Notifications</h2>
            
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="lucide:bell-off" className="text-gray-400 mb-4 mx-auto" width={48} />
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'border-gray-700 bg-gray-800/50' 
                        : 'border-primary/50 bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        notification.read ? 'bg-gray-700' : 'bg-primary/20'
                      }`}>
                        <Icon 
                          icon={getNotificationIcon(notification.type)} 
                          className={notification.read ? 'text-gray-400' : 'text-primary'}
                          width={20}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-medium">{notification.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                            <p className="text-gray-500 text-xs mt-2">
                              {notification.createdAt?.toDate ? 
                                new Date(notification.createdAt.toDate()).toLocaleString() : 
                                'Recently'}
                            </p>
                          </div>
                          <Chip
                            size="sm"
                            color={getNotificationColor(notification.type)}
                            variant="flat"
                          >
                            {notification.type.replace(/_/g, ' ')}
                          </Chip>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {notification.link && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onClick={() => {
                                markAsRead(notification.id);
                                navigate(notification.link!);
                              }}
                            >
                              View
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotificationsPage;