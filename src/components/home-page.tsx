import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Avatar, AvatarGroup, Chip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/theme-context";
import { useAuth } from "../contexts/AuthContext";

interface HomePageProps {
  setCurrentPage?: (page: string) => void;
  isDarkMode?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage: _setCurrentPage, isDarkMode = true }) => {
  const navigate = useNavigate();
  const { isDarkMode: contextDarkMode } = useTheme();
  const { user } = useAuth();
  const finalDarkMode = isDarkMode || contextDarkMode;
  
  // Note: setCurrentPage is passed from parent but we're using React Router navigation
  // This prop is kept for backward compatibility but not used internally
  // finalDarkMode is available if needed for conditional styling
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/looking-for-work');
  };

  const stats = [
    { label: "Active Freelancers", value: "50,000+", icon: "lucide:users" },
    { label: "Jobs Posted", value: "10,000+", icon: "lucide:briefcase" },
    { label: "Happy Clients", value: "15,000+", icon: "lucide:smile" },
    { label: "Success Rate", value: "95%", icon: "lucide:trending-up" }
  ];

  const popularCategories = [
    { name: "Web Development", icon: "lucide:code", count: "2.5k+ jobs" },
    { name: "Graphic Design", icon: "lucide:palette", count: "1.8k+ jobs" },
    { name: "Content Writing", icon: "lucide:pen-tool", count: "1.2k+ jobs" },
    { name: "Digital Marketing", icon: "lucide:megaphone", count: "900+ jobs" },
    { name: "Video Editing", icon: "lucide:video", count: "750+ jobs" },
    { name: "Mobile Development", icon: "lucide:smartphone", count: "600+ jobs" }
  ];

  return (
    <div className={`container mx-auto max-w-7xl px-4 pb-20 ${finalDarkMode ? '' : ''}`}>
      {/* Hero Section */}
      <motion.section 
        className="py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6 font-outfit">
          Find the perfect <span className="text-beamly-secondary">freelance</span><br />
          services for your business
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Connect with talented freelancers and get your projects done quickly and efficiently on Beamly.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Try 'building a website' or 'logo design'"
              size="lg"
              className="flex-1"
              classNames={{
                inputWrapper: "bg-white/10 backdrop-blur-md border-white/20",
                input: "text-white placeholder:text-gray-400"
              }}
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            />
            <Button 
              type="submit"
              color="secondary" 
              size="lg" 
              className="px-8 font-medium text-beamly-third"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <span>Popular:</span>
          <div className="flex gap-2 flex-wrap justify-center">
            {["Website Design", "Logo Design", "WordPress", "AI Services"].map((item) => (
              <Chip 
                key={item} 
                variant="bordered" 
                className="border-white/20 text-gray-300 cursor-pointer hover:bg-white/10"
                onClick={() => navigate('/looking-for-work')}
              >
                {item}
              </Chip>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect text-center p-6">
                <CardBody>
                  <Icon icon={stat.icon} className="text-4xl text-beamly-secondary mb-2 mx-auto" />
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  <p className="text-gray-400">{stat.label}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Popular Categories */}
      <motion.section 
        className="py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Explore Popular Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card 
                className="glass-effect cursor-pointer hover:bg-white/5 transition-colors"
                isPressable
                onPress={() => navigate('/looking-for-work')}
              >
                <CardBody className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-beamly-secondary/20">
                      <Icon icon={category.icon} className="text-2xl text-beamly-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.count}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Featured Freelancers */}
      <motion.section 
        className="py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Top Rated Freelancers
          </h2>
          <p className="text-gray-400">
            Work with talented professionals who deliver exceptional results
          </p>
        </div>
        
        <div className="flex justify-center items-center">
          <AvatarGroup isBordered max={7} total={50000}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Avatar
                key={i}
                src={`https://i.pravatar.cc/150?u=${i}`}
                className="w-20 h-20"
              />
            ))}
          </AvatarGroup>
        </div>
        
        <div className="text-center mt-8">
          <Button
            color="primary"
            size="lg"
            variant="bordered"
            className="text-white border-white"
            onPress={() => navigate('/browse-freelancers')}
            endContent={<Icon icon="lucide:arrow-right" />}
          >
            Browse All Freelancers
          </Button>
        </div>
      </motion.section>

      {/* CTA Section */}
      {!user && (
        <div className="py-16">
          <Card className="yellow-glass p-8 text-center">
            <CardBody>
              <h2 className="text-3xl font-bold mb-4 text-white">
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
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};