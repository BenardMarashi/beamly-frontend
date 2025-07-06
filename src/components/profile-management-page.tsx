import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Divider } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

interface ProfileManagementPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const ProfileManagementPage: React.FC<ProfileManagementPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setProfileData(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const profilePicture = profileData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${profileData?.displayName || user?.displayName || 'User'}&background=0F43EE&color=fff`;

  const menuItems = [
    { name: "Your Favorites", icon: "lucide:heart", page: "favorites" },
    { name: "Payment Methods", icon: "lucide:credit-card", page: "payment" },
    { name: "Earnings", icon: "lucide:wallet", page: "earnings" },
    { name: "Tell Your Friend", icon: "lucide:users", page: "referrals" },
    { name: "Promotions", icon: "lucide:tag", page: "promotions" },
    { name: "Settings", icon: "lucide:settings", page: "settings" }
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] pb-16 px-4 flex items-center justify-center">
        <Icon icon="lucide:loader-2" className="animate-spin text-beamly-secondary" width={48} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] pb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="light"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={() => navigate('/dashboard')}
            className={isDarkMode ? "text-white" : "text-gray-800"}
          >
            Back
          </Button>
          <Button
            variant="light"
            isIconOnly
            onPress={() => navigate('/settings')}
            className={isDarkMode ? "text-white" : "text-gray-800"}
          >
            <Icon icon="lucide:edit-2" />
          </Button>
        </div>
        
        <Card className={`glass-effect border-none ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <Avatar 
                src={profilePicture} 
                className="w-16 h-16"
                name={profileData?.displayName || user?.displayName || "User"}
              />
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {profileData?.displayName || user?.displayName || "User"}
                </h1>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  {profileData?.userType === 'both' 
                    ? 'Freelancer & Client' 
                    : profileData?.userType === 'freelancer'
                    ? 'Freelancer'
                    : profileData?.userType === 'client'
                    ? 'Client'
                    : 'Member'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              {profileData?.phone && (
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Icon icon="lucide:phone" className="text-beamly-secondary" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Icon icon="lucide:mail" className="text-beamly-secondary" />
                <span>{user?.email}</span>
              </div>
              {profileData?.location && (
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Icon icon="lucide:map-pin" className="text-beamly-secondary" />
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-beamly-secondary">
                  ${profileData?.totalEarnings || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Earned
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-beamly-primary">
                  {profileData?.completedProjects || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Projects
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-beamly-secondary">
                  {profileData?.rating?.toFixed(1) || '0.0'}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rating
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Divider className="my-6 bg-white/10" />
        
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Card 
              key={item.page}
              className={`glass-effect border-none ${!isDarkMode && 'border border-gray-200'} card-hover`}
              isPressable
              onPress={() => {
                if (item.page === 'settings') {
                  navigate('/settings');
                } else {
                  navigate(`/${item.page}`);
                }
              }}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                      <Icon icon={item.icon} className="text-beamly-secondary" />
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                  </div>
                  <Icon 
                    icon="lucide:chevron-right" 
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"} 
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        
        <Divider className="my-6 bg-white/10" />
        
        <Card className={`glass-effect border-none ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <Icon icon="lucide:log-out" className="text-red-500" />
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Sign Out
                </span>
              </div>
              <Icon 
                icon="lucide:chevron-right" 
                className={isDarkMode ? "text-gray-400" : "text-gray-600"} 
              />
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};