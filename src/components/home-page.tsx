import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody } from "@nextui-org/react";
import { Icon } from "@iconify/react";

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, isDarkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const categories = [
    { 
      name: "Graphic Design", 
      icon: "lucide:palette", 
      value: "design",
      description: "Find talented freelancers",
      iconColor: "#FF6B6B"
    },
    { 
      name: "Web Development", 
      icon: "lucide:code", 
      value: "development",
      description: "Find talented freelancers",
      iconColor: "#4ECDC4"
    },
    { 
      name: "Digital Marketing", 
      icon: "lucide:megaphone", 
      value: "marketing",
      description: "Find talented freelancers",
      iconColor: "#FFD93D"
    },
    { 
      name: "Writing & Translation", 
      icon: "lucide:pen-tool", 
      value: "writing",
      description: "Find talented freelancers",
      iconColor: "#6A0572"
    },
    { 
      name: "Video & Animation", 
      icon: "lucide:video", 
      value: "video",
      description: "Find talented freelancers",
      iconColor: "#1A936F"
    },
    { 
      name: "Music & Audio", 
      icon: "lucide:music", 
      value: "music",
      description: "Find talented freelancers",
      iconColor: "#3D348B"
    },
    { 
      name: "Programming", 
      icon: "lucide:terminal", 
      value: "programming",
      description: "Find talented freelancers",
      iconColor: "#F18701"
    },
    { 
      name: "Business", 
      icon: "lucide:briefcase", 
      value: "business",
      description: "Find talented freelancers",
      iconColor: "#7678ED"
    }
  ];

  const features = [
    {
      icon: "lucide:check-circle",
      title: "Quality Work",
      description: "Find the highest quality services and talents with our strict quality control and vetting process."
    },
    {
      icon: "lucide:zap",
      title: "Zero Commission", 
      description: "Keep more of what you earn with our zero commission policy for freelancers."
    },
    {
      icon: "lucide:shield",
      title: "Secure Payments",
      description: "Your payments are protected with our secure payment system and escrow service."
    },
    {
      icon: "lucide:headphones",
      title: "24/7 Support",
      description: "Get help anytime you need with our dedicated customer support team available round the clock."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Create an Account",
      description: "Sign up for free and complete your profile to get started"
    },
    {
      number: "2", 
      title: "Discover Services",
      description: "Browse through thousands of services or post a request"
    },
    {
      number: "3",
      title: "Hire Freelancers", 
      description: "Choose the perfect freelancer for your project and collaborate"
    },
    {
      number: "4",
      title: "Complete Project",
      description: "Approve the work and release payment when satisfied"
    }
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage(`browse-freelancers?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setCurrentPage('browse-freelancers');
    }
  };

  const handleCategoryClick = (categoryValue: string) => {
    setCurrentPage(`browse-freelancers?category=${categoryValue}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-mesh' : 'bg-white'}`}>
      <div className="relative">
        {/* Gradient accents */}
        <div className="blue-accent blue-accent-1"></div>
        <div className="blue-accent blue-accent-2"></div>
        <div className="yellow-accent yellow-accent-1"></div>
        <div className="yellow-accent yellow-accent-2"></div>
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 z-10">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Find the perfect <span className="text-beamly-secondary">Beamly</span>
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
                Connect with talented freelancers and get your projects done quickly and efficiently on Beamly
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex">
                  <Input
                    placeholder="Search for projects..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onKeyPress={handleKeyPress}
                    size="lg"
                    radius="lg"
                    className="flex-1"
                    classNames={{
                      input: isDarkMode ? "text-white" : "text-gray-900",
                      inputWrapper: `${isDarkMode ? 'bg-white/10 backdrop-blur-md border-white/20' : 'bg-gray-100 border-gray-300'} rounded-r-none`
                    }}
                  />
                  <Button 
                    size="lg"
                    radius="lg"
                    className="bg-beamly-secondary text-black font-medium px-6 rounded-l-none"
                    onPress={handleSearch}
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              {/* Popular searches */}
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Popular:</span>
                {["Web Design", "Logo Design", "Content Writing", "Video Editing"].map((term) => (
                  <Button
                    key={term}
                    size="sm"
                    variant="flat"
                    className={`${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'} text-sm`}
                    onPress={() => {
                      setSearchQuery(term);
                      handleSearch();
                    }}
                  >
                    {term}
                  </Button>
                ))}
              </div>
              
              {/* Trusted by */}
              <div className="flex justify-center items-center gap-8 flex-wrap">
                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Trusted by leading brands</span>
                <div className="flex items-center gap-6 opacity-60">
                  <Icon icon="logos:google" className="text-2xl" />
                  <Icon icon="logos:microsoft-icon" className="text-2xl" />
                  <Icon icon="tabler:brand-shopify" className="text-2xl text-green-500" />
                  <Icon icon="logos:spotify-icon" className="text-2xl" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="relative py-16 px-4 z-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Explore Popular <span className="text-beamly-secondary">Categories</span>
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Find and hire the top categories to help you achieve your goals
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card
                    isPressable
                    className={`${isDarkMode ? 'glass-card' : 'bg-white border border-gray-200'} hover:scale-105 transition-all cursor-pointer`}
                    onPress={() => handleCategoryClick(category.value)}
                  >
                    <CardBody className="p-6 text-center">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: `${category.iconColor}20` }}
                      >
                        <Icon 
                          icon={category.icon} 
                          className="text-2xl"
                          style={{ color: category.iconColor }}
                        />
                      </div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>
                        {category.name}
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                        {category.description}
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button
                variant="bordered"
                className="border-beamly-secondary text-beamly-secondary"
                onPress={() => setCurrentPage('browse-freelancers')}
              >
                Browse All Categories
              </Button>
            </div>
          </div>
        </section>
        
        {/* Why Choose Beamly */}
        <section className="relative py-16 px-4 z-10">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Why Choose <span className="text-beamly-secondary">Beamly</span>
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                We're committed to providing the best freelance experience for everyone
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className={isDarkMode ? 'glass-card' : 'bg-white border border-gray-200'}>
                    <CardBody className="p-6 text-center">
                      <div className="w-12 h-12 bg-beamly-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Icon icon={feature.icon} className="text-xl text-beamly-secondary" />
                      </div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                        {feature.description}
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How Beamly Works */}
        <section className="relative py-16 px-4 mb-16 z-10">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                How <span className="text-beamly-secondary">Beamly</span> Works
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Get your projects done in 4 simple steps
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-center relative"
                >
                  {index < steps.length - 1 && (
                    <div className={`hidden lg:block absolute top-12 left-[60%] w-full h-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} -z-10`}></div>
                  )}
                  <div className="w-16 h-16 bg-beamly-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-black">
                    {step.number}
                  </div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};