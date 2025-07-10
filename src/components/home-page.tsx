import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Avatar, Badge } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { HeroSection } from "./hero-section";
import { CategoriesSection } from "./categories-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";
import { CTASection } from "./cta-section";

interface HomePageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentPage, isDarkMode = true }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const userName = "Alexander"; // This would come from user context in a real app
  
  const categories = [
    { name: t('categories.items.graphicDesign'), icon: "lucide:palette", page: "design-jobs" },
    { name: t('categories.items.webDevelopment'), icon: "lucide:code", page: "development-jobs" },
    { name: t('categories.items.writingTranslation'), icon: "lucide:pen-tool", page: "writing-jobs" },
    { name: t('categories.items.digitalMarketing'), icon: "lucide:megaphone", page: "marketing-jobs" }
  ];
  
  const featuredJobs = [
    {
      id: 1,
      title: "Senior UI Designer",
      company: "Apple Inc.",
      price: "$55K - $80K",
      image: "https://img.heroui.chat/image/ai?w=400&h=300&u=apple-logo",
      type: "Full time",
      location: "Remote"
    },
    {
      id: 2,
      title: "WordPress Developer",
      company: "Microsoft",
      price: "$45K - $60K",
      image: "https://img.heroui.chat/image/ai?w=400&h=300&u=microsoft-logo",
      type: "Contract",
      location: "Hybrid"
    }
  ];
  
  const topFreelancers = [
    {
      id: 1,
      name: "Sarah Johnson",
      title: "UI/UX Designer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=sarah1",
      rating: 4.9,
      projectsCompleted: 124
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Full Stack Developer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=michael1",
      rating: 4.8,
      projectsCompleted: 98
    }
  ];
  
  // Show landing page for non-logged in users
  const isLoggedIn = false; // This should come from auth context
  
  if (!isLoggedIn) {
    return (
      <div>
        {/* Hero Section */}
        <HeroSection setCurrentPage={setCurrentPage} />
        
        {/* Categories Section */}
        <CategoriesSection setCurrentPage={setCurrentPage} />
        
        {/* How It Works Section */}
        <HowItWorksSection />
        
        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* CTA Section */}
        <CTASection setCurrentPage={setCurrentPage} />
      </div>
    );
  }
  
  // Dashboard view for logged in users
  return (
    <div className="min-h-[calc(100vh-64px)] pb-16">
      {/* Welcome section with search */}
      <div className="glass-effect mx-4 mt-4 p-4 md:p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
          <Avatar 
            src="https://img.heroui.chat/image/avatar?w=100&h=100&u=user1" 
            className="w-12 h-12 border-2 border-beamly-secondary"
          />
          <div className="flex-1">
            <p className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-600 text-sm"}>
              {t('home.welcome', { name: userName })}
            </p>
            <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('home.whatJob')}
            </h1>
          </div>
          <div className="ml-auto">
            <Badge content="3" color="secondary" shape="circle">
              <Button isIconOnly variant="light" className={isDarkMode ? "text-white" : "text-gray-800"}>
                <Icon icon="lucide:bell" width={24} />
              </Button>
            </Badge>
          </div>
        </div>
        
        <div className="relative">
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onValueChange={setSearchQuery}
            size="lg"
            radius="lg"
            className={isDarkMode ? "bg-white/10 border-white/20" : "bg-white border-gray-200"}
            startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            endContent={
              searchQuery && (
                <Button isIconOnly size="sm" variant="light" className="text-gray-400" onPress={() => setSearchQuery("")}>
                  <Icon icon="lucide:x" width={16} />
                </Button>
              )
            }
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="px-4 mt-6">
        <h2 className={`text-lg md:text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {t('home.jobCategories')}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="min-w-[100px] md:min-w-[120px]"
            >
              <Button
                className={`w-full h-[70px] md:h-[80px] glass-card flex flex-col gap-2 py-3 md:py-4 ${!isDarkMode && 'border border-gray-200'}`}
                onPress={() => setCurrentPage(category.page)}
              >
                <Icon icon={category.icon} className="text-beamly-secondary text-xl md:text-2xl" />
                <span className={`${isDarkMode ? "text-white" : "text-gray-800"} text-xs md:text-sm`}>{category.name}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Featured Jobs */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.featuredJobs')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0 text-sm"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => setCurrentPage("all-jobs")}
          >
            {t('home.explore')}
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {featuredJobs.map((job, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              className="min-w-[200px] md:min-w-[220px] max-w-[220px]"
            >
              <Card 
                className={`glass-card border-none card-hover ${!isDarkMode && 'border border-gray-200'}`}
                isPressable
                onPress={() => setCurrentPage("job-details")}
              >
                <CardBody className="p-0 overflow-hidden">
                  <div className="relative">
                    <div className={`w-full h-28 md:h-32 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center`}>
                      <img 
                        src={job.image} 
                        alt={job.company}
                        className="w-14 h-14 md:w-16 md:h-16 object-contain"
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-beamly-secondary text-beamly-third font-medium px-2 py-1 rounded-lg text-xs">
                      {job.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className={`font-semibold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{job.title}</h3>
                    <p className="text-gray-400 text-xs">{job.company}</p>
                    <div className="flex items-center mt-2 text-xs gap-2">
                      <span className={`${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded`}>{job.type}</span>
                      <span className={`${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded`}>{job.location}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Top Freelancers */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.topFreelancers')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0 text-sm"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => setCurrentPage("freelancers")}
          >
            {t('common.seeMore')}
          </Button>
        </div>
        
        <div className="flex flex-col gap-3">
          {topFreelancers.map((freelancer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card 
                className={`${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} border-none card-hover`}
                isPressable
                onPress={() => setCurrentPage("freelancer-profile")}
              >
                <CardBody className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={freelancer.avatar} 
                      className="w-10 h-10 md:w-12 md:h-12"
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {freelancer.name}
                      </h3>
                      <p className="text-gray-400 text-xs">{freelancer.title}</p>
                      <div className="flex items-center mt-1 text-xs">
                        <Icon icon="lucide:star" className="text-beamly-secondary mr-1" />
                        <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>{freelancer.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-beamly-secondary font-semibold text-sm md:text-base">{freelancer.projectsCompleted}</div>
                      <div className="text-gray-400 text-xs">{t('home.projects')}</div>
                      <Button 
                        size="sm" 
                        color="secondary"
                        className="mt-1 text-xs font-medium text-beamly-third"
                        onPress={() => setCurrentPage("freelancer-profile")}
                      >
                        {t('common.view')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="px-4 mt-8 mb-20 md:mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.recentActivity')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0 text-sm"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => setCurrentPage("dashboard")}
          >
            {t('common.viewAll')}
          </Button>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('home.activeProjects')}
              </h3>
              <Badge color="secondary" content="2" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-beamly-secondary/20 flex items-center justify-center">
                    <Icon icon="lucide:code" className="text-beamly-secondary" />
                  </div>
                  <div>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-medium text-sm md:text-base`}>
                      Website Redesign
                    </p>
                    <p className="text-gray-400 text-xs">{t('home.dueInDays', { days: 3 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-beamly-secondary font-medium text-sm">75%</p>
                  <div className="w-16 h-1 bg-white/20 rounded-full mt-1">
                    <div className="h-full w-3/4 bg-beamly-secondary rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-beamly-primary/20 flex items-center justify-center">
                    <Icon icon="lucide:image" className="text-beamly-primary" />
                  </div>
                  <div>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-medium text-sm md:text-base`}>
                      Logo Animation
                    </p>
                    <p className="text-gray-400 text-xs">{t('home.dueInDays', { days: 5 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-beamly-primary font-medium text-sm">40%</p>
                  <div className="w-16 h-1 bg-white/20 rounded-full mt-1">
                    <div className="h-full w-2/5 bg-beamly-primary rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              className={`w-full mt-4 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}`}
              variant="flat"
              onPress={() => setCurrentPage("post-job")}
            >
              {t('home.postNewJob')}
            </Button>
          </CardBody>
        </Card>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/10 py-2 px-6 flex justify-between items-center md:hidden">
        <Button 
          isIconOnly 
          variant="light" 
          className="text-beamly-secondary"
          onPress={() => setCurrentPage("home")}
        >
          <Icon icon="lucide:home" width={24} />
        </Button>
        
        <Button 
          isIconOnly 
          variant="light" 
          className={isDarkMode ? "text-white" : "text-gray-800"}
          onPress={() => setCurrentPage("messages")}
        >
          <Icon icon="lucide:message-circle" width={24} />
        </Button>
        
        <Button 
          isIconOnly 
          color="secondary"
          className="rounded-full w-14 h-14 text-beamly-third shadow-lg"
          onPress={() => setCurrentPage("post-job")}
        >
          <Icon icon="lucide:plus" width={24} />
        </Button>
        
        <Button 
          isIconOnly 
          variant="light" 
          className={isDarkMode ? "text-white" : "text-gray-800"}
          onPress={() => setCurrentPage("saved-jobs")}
        >
          <Icon icon="lucide:bookmark" width={24} />
        </Button>
        
        <Button 
          isIconOnly 
          variant="light" 
          className={isDarkMode ? "text-white" : "text-gray-800"}
          onPress={() => setCurrentPage("profile")}
        >
          <Icon icon="lucide:user" width={24} />
        </Button>
      </div>
    </div>
  );
};