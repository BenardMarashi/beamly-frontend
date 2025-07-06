import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Avatar, Badge } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, isDarkMode = true }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchFeaturedJobs();
      fetchTopFreelancers();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchFeaturedJobs = async () => {
    try {
      const jobsQuery = query(
        collection(db, "jobs"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc"),
        limit(2)
      );
      const snapshot = await getDocs(jobsQuery);
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeaturedJobs(jobs);
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
    }
  };

  const fetchTopFreelancers = async () => {
    try {
      const freelancersQuery = query(
        collection(db, "users"),
        where("userType", "in", ["freelancer", "both"]),
        where("rating", ">=", 4.5),
        orderBy("rating", "desc"),
        orderBy("completedProjects", "desc"),
        limit(2)
      );
      const snapshot = await getDocs(freelancersQuery);
      const freelancers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTopFreelancers(freelancers);
    } catch (error) {
      console.error("Error fetching top freelancers:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const categories = [
    { name: "Design", icon: "lucide:palette", page: "design-jobs" },
    { name: "Development", icon: "lucide:code", page: "development-jobs" },
    { name: "Writing", icon: "lucide:pen-tool", page: "writing-jobs" },
    { name: "Marketing", icon: "lucide:megaphone", page: "marketing-jobs" }
  ];
  
  const displayName = userData?.displayName || user?.displayName || "there";
  const profilePicture = userData?.photoURL || user?.photoURL || 
    `https://ui-avatars.com/api/?name=${displayName}&background=0F43EE&color=fff`;
  
  return (
    <div className="min-h-[calc(100vh-64px)] pb-16">
      {/* Welcome section with search */}
      <div className="glass-effect mx-4 mt-4 p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Avatar 
            src={profilePicture}
            className="w-12 h-12 border-2 border-beamly-secondary"
            name={displayName}
          />
          <div>
            <p className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-600 text-sm"}>
              Hi, {displayName.split(' ')[0]}!
            </p>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              What job are you looking for?
            </h1>
          </div>
          <div className="ml-auto">
            <Badge content={3} color="secondary" shape="circle">
              <Button 
                isIconOnly 
                variant="light" 
                className={isDarkMode ? "text-white" : "text-gray-800"}
                onPress={() => navigate('/notifications')}
              >
                <Icon icon="lucide:bell" width={20} />
              </Button>
            </Badge>
          </div>
        </div>
        
        <div className="relative">
          <Input
            size="lg"
            variant="bordered"
            placeholder="Search for jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="bg-white/10"
            startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            endContent={
              <Button 
                color="secondary" 
                size="sm"
                className="font-medium text-beamly-third"
                onPress={() => {
                  if (searchQuery.trim()) {
                    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              >
                Search
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="px-4 mt-6">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`${isDarkMode ? 'glass-card' : 'yellow-glass'} border-none card-hover`}
                isPressable
                onPress={() => navigate(`/jobs?category=${category.name.toLowerCase()}`)}
              >
                <CardBody className="p-4 text-center">
                  <Icon 
                    icon={category.icon} 
                    className="mx-auto mb-2 text-beamly-secondary" 
                    width={32} 
                  />
                  <p className="font-medium text-white">{category.name}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Featured Jobs */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Featured Jobs
          </h2>
          <Button 
            variant="light" 
            endContent={<Icon icon="lucide:arrow-right" />}
            className={isDarkMode ? "text-white" : "text-gray-800"}
            onPress={() => navigate('/jobs')}
          >
            View All
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <Icon icon="lucide:loader-2" className="animate-spin mx-auto" width={32} />
          </div>
        ) : featuredJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {featuredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className={`${isDarkMode ? 'glass-card' : 'yellow-glass'} border-none card-hover`}
                  isPressable
                  onPress={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardBody className="p-4">
                    <div className="flex gap-4">
                      <Avatar
                        src={job.clientPhotoURL || `https://ui-avatars.com/api/?name=${job.clientName}&background=0F43EE&color=fff`}
                        className="w-16 h-16"
                        name={job.clientName}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{job.title}</h3>
                        <p className="text-gray-400 text-sm">{job.clientName}</p>
                        <p className="text-beamly-secondary font-bold mt-1">
                          {job.budgetType === 'fixed' 
                            ? `$${job.fixedPrice}` 
                            : `$${job.budgetMin} - $${job.budgetMax}/hr`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge color="secondary" variant="flat" size="sm">
                            {job.experienceLevel}
                          </Badge>
                          <Badge color="primary" variant="flat" size="sm">
                            {job.locationType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className={`${isDarkMode ? 'glass-card' : 'yellow-glass'} border-none`}>
            <CardBody className="p-8 text-center">
              <Icon icon="lucide:briefcase" className="mx-auto mb-4 text-gray-400" width={48} />
              <p className="text-gray-400">No featured jobs available at the moment</p>
              <Button 
                color="secondary" 
                className="mt-4"
                onPress={() => navigate('/jobs')}
              >
                Browse All Jobs
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
      
      {/* Top Freelancers */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Top Freelancers
          </h2>
          <Button 
            variant="light" 
            endContent={<Icon icon="lucide:arrow-right" />}
            className={isDarkMode ? "text-white" : "text-gray-800"}
            onPress={() => navigate('/freelancers')}
          >
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {topFreelancers.length > 0 ? (
            topFreelancers.map((freelancer, index) => (
              <motion.div
                key={freelancer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className={`${isDarkMode ? 'glass-card' : 'yellow-glass'} border-none card-hover`}
                  isPressable
                  onPress={() => navigate(`/freelancers/${freelancer.id}`)}
                >
                  <CardBody className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={freelancer.photoURL || `https://ui-avatars.com/api/?name=${freelancer.displayName}&background=0F43EE&color=fff`}
                        className="w-12 h-12"
                        name={freelancer.displayName}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{freelancer.displayName}</h3>
                        <p className="text-gray-400 text-xs">
                          {freelancer.skills?.slice(0, 2).join(', ') || 'Freelancer'}
                        </p>
                        <div className="flex items-center mt-1 text-xs">
                          <Icon icon="lucide:star" className="text-beamly-secondary mr-1" />
                          <span className="text-white">{freelancer.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-beamly-secondary font-semibold">
                          {freelancer.completedProjects || 0}
                        </div>
                        <div className="text-gray-400 text-xs">Projects</div>
                        <Button 
                          size="sm" 
                          color="secondary"
                          className="mt-1 text-xs font-medium text-beamly-third"
                          onPress={() => navigate(`/freelancers/${freelancer.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className={`${isDarkMode ? 'glass-card' : 'yellow-glass'} border-none`}>
              <CardBody className="p-6 text-center">
                <Icon icon="lucide:users" className="mx-auto mb-3 text-gray-400" width={36} />
                <p className="text-gray-400">No freelancers available yet</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="px-4 mt-8 mb-8">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Button 
            color="secondary" 
            variant="flat"
            className="h-auto py-4 flex-col"
            onPress={() => navigate('/jobs/new')}
          >
            <Icon icon="lucide:plus-circle" width={24} className="mb-1" />
            <span className="text-xs">Post Job</span>
          </Button>
          <Button 
            color="primary" 
            variant="flat"
            className="h-auto py-4 flex-col"
            onPress={() => navigate('/jobs')}
          >
            <Icon icon="lucide:search" width={24} className="mb-1" />
            <span className="text-xs">Find Work</span>
          </Button>
          <Button 
            color="secondary" 
            variant="flat"
            className="h-auto py-4 flex-col"
            onPress={() => navigate('/settings')}
          >
            <Icon icon="lucide:user" width={24} className="mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};