import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Avatar, Badge, Chip, Spinner } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

interface UserData {
  displayName: string;
  photoURL?: string;
  userType: 'freelancer' | 'client' | 'both';
  skills?: string[];
  bio?: string;
  isAvailable?: boolean;
}

interface Job {
  id: string;
  title: string;
  description: string;
  clientName: string;
  category: string;
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  skills: string[];
  createdAt: any;
  proposalCount: number;
}

interface Freelancer {
  id: string;
  displayName: string;
  photoURL?: string;
  skills: string[];
  hourlyRate?: number;
  rating?: number;
  completedProjects?: number;
  bio?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, isDarkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);
  const [userStats, setUserStats] = useState({
    activeJobs: 0,
    proposals: 0,
    earnings: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchFeaturedJobs(),
        fetchTopFreelancers(),
        fetchUserStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
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
        limit(4)
      );
      const snapshot = await getDocs(jobsQuery);
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
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
        where("isAvailable", "==", true),
        orderBy("rating", "desc"),
        limit(4)
      );
      const snapshot = await getDocs(freelancersQuery);
      const freelancers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Freelancer[];
      setTopFreelancers(freelancers);
    } catch (error) {
      console.error("Error fetching top freelancers:", error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      // Fetch active jobs/proposals based on user type
      if (userData?.userType === 'freelancer' || userData?.userType === 'both') {
        // Count active proposals
        const proposalsQuery = query(
          collection(db, "proposals"),
          where("freelancerId", "==", user.uid),
          where("status", "==", "pending")
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        
        // Count active contracts
        const contractsQuery = query(
          collection(db, "contracts"),
          where("freelancerId", "==", user.uid),
          where("status", "==", "active")
        );
        const contractsSnapshot = await getDocs(contractsQuery);
        
        setUserStats(prev => ({
          ...prev,
          proposals: proposalsSnapshot.size,
          activeJobs: contractsSnapshot.size
        }));
      } else if (userData?.userType === 'client') {
        // Count active job postings
        const jobsQuery = query(
          collection(db, "jobs"),
          where("clientId", "==", user.uid),
          where("status", "==", "open")
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        
        setUserStats(prev => ({
          ...prev,
          activeJobs: jobsSnapshot.size
        }));
      }
      
      // Count unread notifications
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      setUserStats(prev => ({
        ...prev,
        notifications: notificationsSnapshot.size
      }));
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
  };

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    } else {
      return `$${job.budgetMin}-${job.budgetMax}/hr`;
    }
  };

  const categories = [
    { name: "Design", icon: "lucide:palette", color: "bg-purple-500" },
    { name: "Development", icon: "lucide:code-2", color: "bg-blue-500" },
    { name: "Writing", icon: "lucide:pen-tool", color: "bg-green-500" },
    { name: "Marketing", icon: "lucide:megaphone", color: "bg-orange-500" }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Hero Section */}
      <div className="px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {user ? `Welcome back, ${userData?.displayName || 'User'}!` : 'Find the perfect freelance services'}
          </h1>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {user ? 'What would you like to work on today?' : 'Connect with talented professionals for your projects'}
          </p>
          
          <div className="max-w-2xl mx-auto flex gap-4">
            <Input
              placeholder="Search for services..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
              size="lg"
              variant="bordered"
              className="flex-1"
            />
            <Button 
              color="secondary" 
              size="lg"
              className="text-beamly-third font-medium"
              onPress={handleSearch}
            >
              Search
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* User Stats (if logged in) */}
      {user && (
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card border-none">
              <CardBody className="p-4 text-center">
                <div className="text-3xl font-bold text-beamly-secondary">{userStats.activeJobs}</div>
                <div className="text-sm text-gray-400">Active Jobs</div>
              </CardBody>
            </Card>
            <Card className="glass-card border-none">
              <CardBody className="p-4 text-center">
                <div className="text-3xl font-bold text-beamly-secondary">{userStats.proposals}</div>
                <div className="text-sm text-gray-400">Proposals</div>
              </CardBody>
            </Card>
            <Card className="glass-card border-none">
              <CardBody className="p-4 text-center">
                <div className="text-3xl font-bold text-beamly-secondary">${userStats.earnings}</div>
                <div className="text-sm text-gray-400">Earnings</div>
              </CardBody>
            </Card>
            <Card className="glass-card border-none">
              <CardBody className="p-4 text-center">
                <Badge content={userStats.notifications} color="danger" isInvisible={userStats.notifications === 0}>
                  <div className="text-3xl font-bold text-beamly-secondary">{userStats.notifications}</div>
                </Badge>
                <div className="text-sm text-gray-400">Notifications</div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {/* Categories */}
      <div className="px-4 mb-8">
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
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
                  <div className={`${category.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon icon={category.icon} className="text-white" width={24} />
                  </div>
                  <p className="font-medium text-white">{category.name}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Featured Jobs */}
      <div className="px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Featured Jobs
          </h2>
          <Button 
            variant="light" 
            endContent={<Icon icon="lucide:arrow-right" />}
            className={isDarkMode ? "text-white" : "text-gray-800"}
            onPress={() => navigate('/looking-for-work')}
          >
            View All
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {featuredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`${isDarkMode ? 'glass-card' : 'bg-white'} border-none card-hover`}
                isPressable
                onPress={() => navigate(`/jobs/${job.id}`)}
              >
                <CardBody className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {job.title}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        by {job.clientName}
                      </p>
                    </div>
                    <Chip color="secondary" variant="flat">
                      {formatBudget(job)}
                    </Chip>
                  </div>
                  
                  <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {job.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <Chip key={idx} size="sm" variant="flat" className="text-xs">
                          {skill}
                        </Chip>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {job.proposalCount} proposals
                    </span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Top Freelancers */}
      <div className="px-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Top Freelancers
          </h2>
          <Button 
            variant="light" 
            endContent={<Icon icon="lucide:arrow-right" />}
            className={isDarkMode ? "text-white" : "text-gray-800"}
            onPress={() => navigate('/browse-freelancers')}
          >
            View All
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topFreelancers.map((freelancer, index) => (
            <motion.div
              key={freelancer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`${isDarkMode ? 'glass-card' : 'bg-white'} border-none card-hover`}
                isPressable
                onPress={() => navigate(`/freelancer/${freelancer.id}`)}
              >
                <CardBody className="p-4 text-center">
                  <Avatar
                    src={freelancer.photoURL}
                    name={freelancer.displayName}
                    className="mx-auto mb-3"
                    size="lg"
                  />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {freelancer.displayName}
                  </h3>
                  <div className="flex items-center justify-center mb-2">
                    <Icon icon="lucide:star" className="text-yellow-400 mr-1" width={16} />
                    <span className="text-sm text-gray-400">
                      {freelancer.rating?.toFixed(1) || '5.0'} ({freelancer.completedProjects || 0} jobs)
                    </span>
                  </div>
                  <p className={`text-sm mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {freelancer.bio || freelancer.skills.join(', ')}
                  </p>
                  {freelancer.hourlyRate && (
                    <div className="text-beamly-secondary font-bold">
                      ${freelancer.hourlyRate}/hr
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Call to Action */}
      {!user && (
        <div className="px-4 py-12 text-center">
          <Card className="yellow-glass border-none p-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-200 mb-6">
              Join thousands of freelancers and clients on Beamly
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                color="secondary"
                size="lg"
                className="text-beamly-third font-medium"
                onPress={() => navigate('/signup')}
              >
                Sign Up Free
              </Button>
              <Button
                variant="bordered"
                size="lg"
                className="text-white border-white"
                onPress={() => navigate('/how-it-works')}
              >
                Learn More
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};