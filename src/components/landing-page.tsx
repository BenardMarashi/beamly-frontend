import React from "react";
// FIXED: Removed unused Button import
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface LandingPageProps {
  // FIXED: Removed unused setCurrentPage
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Simulate loading and redirect to home
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-beamly-secondary blur-xl opacity-50"></div>
            <Spinner size="lg" color="secondary" />
          </div>
        </div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Welcome to Beamly
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300"
        >
          Connecting talent with opportunity
        </motion.p>
      </motion.div>
    </div>
  );
};