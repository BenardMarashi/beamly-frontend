import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { Card, CardBody, Button, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ClientDashboard } from "../components/dashboard/ClientDashboard";
import { FreelancerDashboard } from "../components/dashboard/FreelancerDashboard";
import { useNavigate } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<string>('client');
  const [activeTab, setActiveTab] = useState('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserType();
  }, [user]);

  const fetchUserType = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserType(userData.userType || 'client');
        
        // Set default tab based on user type
        if (userData.userType === 'freelancer') {
          setActiveTab('freelancer');
        } else if (userData.userType === 'both') {
          // Keep the last selected tab or default to client
          const savedTab = localStorage.getItem('dashboardTab') || 'client';
          setActiveTab(savedTab);
        }
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: React.Key) => {
    setActiveTab(String(key));
    localStorage.setItem('dashboardTab', String(key));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Icon icon="lucide:loader-2" className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {t('dashboard.welcomeBack', 'Welcome back')}!
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your account and activities
        </p>
      </div>

      {userType === 'both' ? (
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          color="primary"
          variant="bordered"
          className="mb-6"
        >
          <Tab
            key="client"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:briefcase" />
                <span>Client Dashboard</span>
              </div>
            }
          >
            <ClientDashboard isDarkMode={isDarkMode} />
          </Tab>
          <Tab
            key="freelancer"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:user" />
                <span>Freelancer Dashboard</span>
              </div>
            }
          >
            <FreelancerDashboard isDarkMode={isDarkMode} />
          </Tab>
        </Tabs>
      ) : userType === 'freelancer' ? (
        <FreelancerDashboard isDarkMode={isDarkMode} />
      ) : (
        <ClientDashboard isDarkMode={isDarkMode} />
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userType !== 'freelancer' && (
            <Button
              variant="flat"
              color="primary"
              startContent={<Icon icon="lucide:plus" />}
              onPress={() => navigate('/post-job')}
              className="h-auto py-4 flex-col gap-2"
            >
              <span className="text-xs">Post a Job</span>
            </Button>
          )}
          
          {userType !== 'client' && (
            <Button
              variant="flat"
              color="secondary"
              startContent={<Icon icon="lucide:search" />}
              onPress={() => navigate('/looking-for-work')}
              className="h-auto py-4 flex-col gap-2"
            >
              <span className="text-xs">Find Work</span>
            </Button>
          )}
          
          <Button
            variant="flat"
            color="success"
            startContent={<Icon icon="lucide:message-square" />}
            onPress={() => navigate('/chat')}
            className="h-auto py-4 flex-col gap-2"
          >
            <span className="text-xs">Messages</span>
          </Button>
          
          <Button
            variant="flat"
            color="warning"
            startContent={<Icon icon="lucide:user" />}
            onPress={() => navigate('/profile/edit')}
            className="h-auto py-4 flex-col gap-2"
          >
            <span className="text-xs">Edit Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;