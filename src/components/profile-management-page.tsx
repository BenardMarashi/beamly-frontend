import React from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ProfileManagementPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const ProfileManagementPage: React.FC<ProfileManagementPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true
}) => {
  const profileData = {
    name: "Emma Phillips",
    title: "UI/UX Designer",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=emma1",
    phone: "(581)-307-6902",
    email: "emma.phillips@gmail.com",
    walletBalance: "$140.00",
    orders: 12,
    menuItems: [
      { name: "Your Favorites", icon: "lucide:heart", page: "favorites" },
      { name: "Payment", icon: "lucide:credit-card", page: "payment" },
      { name: "Tell Your Friend", icon: "lucide:users", page: "referrals" },
      { name: "Promotions", icon: "lucide:tag", page: "promotions" },
      { name: "Settings", icon: "lucide:settings", page: "settings" }
    ]
  };

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
            onPress={() => setCurrentPage("home")}
            className={isDarkMode ? "text-white" : "text-gray-800"}
          >
            Back
          </Button>
          <Button
            variant="light"
            isIconOnly
            onPress={() => setCurrentPage("edit-profile")}
            className={isDarkMode ? "text-white" : "text-gray-800"}
          >
            <Icon icon="lucide:edit-2" />
          </Button>
        </div>
        
        <Card className={`glass-effect border-none ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <Avatar 
                src={profileData.avatar} 
                className="w-16 h-16"
              />
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{profileData.name}</h1>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{profileData.title}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Icon icon="lucide:phone" className="text-beamly-secondary" />
                <span>{profileData.phone}</span>
              </div>
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Icon icon="lucide:mail" className="text-beamly-secondary" />
                <span>{profileData.email}</span>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <div className="text-center">
                <p className="text-beamly-secondary font-bold text-xl">{profileData.walletBalance}</p>
                <p className="text-gray-300 text-sm">Wallet</p>
              </div>
              <div className="text-center">
                <p className={isDarkMode ? "text-white font-bold text-xl" : "text-gray-800 font-bold text-xl"}>{profileData.orders}</p>
                <p className="text-gray-300 text-sm">Orders</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`glass-card border-none mt-4 ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-0">
            {profileData.menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <Button
                  variant="light"
                  startContent={<Icon icon={item.icon} className="text-beamly-secondary" />}
                  endContent={<Icon icon="lucide:chevron-right" className="text-gray-400" />}
                  className={`w-full justify-between py-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  onPress={() => setCurrentPage(item.page)}
                >
                  {item.name}
                </Button>
                {index < profileData.menuItems.length - 1 && (
                  <Divider className={isDarkMode ? "bg-white/10" : "bg-gray-200"} />
                )}
              </React.Fragment>
            ))}
          </CardBody>
        </Card>
        
        <div className="mt-6">
          <Button
            color="danger"
            variant="flat"
            className="w-full"
            startContent={<Icon icon="lucide:log-out" />}
            onPress={() => setCurrentPage("landing")}
          >
            Log Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
};