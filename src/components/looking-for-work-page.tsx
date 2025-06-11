import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface LookingForWorkPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const LookingForWorkPage: React.FC<LookingForWorkPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("recent");
  const { t } = useTranslation();
  
  const categories = [
    { id: "all", name: t('lookingForWork.filterCategories.all') },
    { id: "design", name: t('lookingForWork.filterCategories.design') },
    { id: "development", name: t('lookingForWork.filterCategories.development') },
    { id: "marketing", name: t('lookingForWork.filterCategories.marketing') },
    { id: "writing", name: t('lookingForWork.filterCategories.writing') },
    { id: "video", name: t('lookingForWork.filterCategories.video') }
  ];
  
  const jobs = [
    {
      id: 1,
      title: "Senior UI Designer",
      company: "Apple Inc.",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=apple-logo",
      salary: "$55K - $80K",
      type: "Full-time",
      location: "Remote",
      posted: "2 days ago",
      category: "design",
      description: "Apple is looking for a UI/UX Designer in Marketing to join our fast growing team."
    },
    {
      id: 2,
      title: "WordPress Developer",
      company: "Microsoft",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=microsoft-logo",
      salary: "$45K - $60K",
      type: "Contract",
      location: "Hybrid",
      posted: "1 day ago",
      category: "development",
      description: "Looking for an experienced WordPress developer to maintain and enhance our corporate websites."
    },
    {
      id: 3,
      title: "Content Writer",
      company: "Google",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=google-logo",
      salary: "$40K - $55K",
      type: "Part-time",
      location: "Remote",
      posted: "3 days ago",
      category: "writing",
      description: "Create engaging content for our blog, social media, and marketing materials."
    },
    {
      id: 4,
      title: "Digital Marketing Specialist",
      company: "Amazon",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=amazon-logo",
      salary: "$50K - $70K",
      type: "Full-time",
      location: "On-site",
      posted: "5 days ago",
      category: "marketing",
      description: "Develop and implement digital marketing strategies to increase brand awareness and drive traffic."
    },
    {
      id: 5,
      title: "Video Editor",
      company: "Netflix",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=netflix-logo",
      salary: "$60K - $75K",
      type: "Contract",
      location: "Remote",
      posted: "1 week ago",
      category: "video",
      description: "Edit and produce high-quality video content for our streaming platform."
    },
    {
      id: 6,
      title: "Full Stack Developer",
      company: "Facebook",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=facebook-logo",
      salary: "$80K - $120K",
      type: "Full-time",
      location: "Hybrid",
      posted: "2 days ago",
      category: "development",
      description: "Build and maintain scalable web applications using React, Node.js, and AWS."
    },
    {
      id: 7,
      title: "Graphic Designer",
      company: "Adobe",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=adobe-logo",
      salary: "$45K - $65K",
      type: "Full-time",
      location: "Remote",
      posted: "3 days ago",
      category: "design",
      description: "Create visually stunning graphics for our marketing campaigns and product materials."
    },
    {
      id: 8,
      title: "SEO Specialist",
      company: "Twitter",
      logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=twitter-logo",
      salary: "$55K - $70K",
      type: "Contract",
      location: "Remote",
      posted: "4 days ago",
      category: "marketing",
      description: "Optimize our website and content to improve search engine rankings and drive organic traffic."
    }
  ];
  
  const filteredJobs = React.useMemo(() => {
    let result = jobs;
    
    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter(job => job.category === filterCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }
    
    // Sort
    switch (sortBy) {
      case "recent":
        return [...result].sort((a, b) => {
          if (a.posted.includes("day") && b.posted.includes("day")) {
            return parseInt(a.posted) - parseInt(b.posted);
          }
          if (a.posted.includes("day")) return -1;
          if (b.posted.includes("day")) return 1;
          return 0;
        });
      case "salary-high":
        return [...result].sort((a, b) => {
          const aMax = parseInt(a.salary.split(" - ")[1].replace("$", "").replace("K", "000"));
          const bMax = parseInt(b.salary.split(" - ")[1].replace("$", "").replace("K", "000"));
          return bMax - aMax;
        });
      case "salary-low":
        return [...result].sort((a, b) => {
          const aMin = parseInt(a.salary.split(" - ")[0].replace("$", "").replace("K", "000"));
          const bMin = parseInt(b.salary.split(" - ")[0].replace("$", "").replace("K", "000"));
          return aMin - bMin;
        });
      default:
        return result;
    }
  }, [jobs, filterCategory, searchQuery, sortBy]);

  // Fix the navigation function
  const handleViewJobDetails = (id: number) => {
    // Instead of just changing page name, use proper routing with ID
    if (typeof window !== 'undefined') {
      window.location.href = `/job/${id}`;
    } else {
      setCurrentPage(`job-details`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{t('lookingForWork.title')}</h1>
      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{t('lookingForWork.subtitle')}</p>
      
      <div className="glass-effect p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder={t('lookingForWork.searchPlaceholder')}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            className={`flex-1 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'}`}
            size="lg"
          />
          <Button 
            color="secondary"
            size="lg"
            className="font-medium font-outfit text-beamly-third"
            onPress={() => {
              console.log("Search jobs button clicked");
              // No navigation, just a log
            }}
          >
            {t('lookingForWork.searchButton')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={filterCategory === category.id ? "solid" : "flat"}
              color={filterCategory === category.id ? "secondary" : "default"}
              size="sm"
              className={filterCategory !== category.id ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800') : ''}
              onPress={() => setFilterCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="bordered" 
              className={isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-800'}
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              {t('lookingForWork.sortBy.title')}: {
                sortBy === "recent" ? t('lookingForWork.sortBy.recent') : 
                sortBy === "salary-high" ? t('lookingForWork.sortBy.salaryHigh') : t('lookingForWork.sortBy.salaryLow')
              }
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            onAction={(key) => setSortBy(key as string)}
            className={isDarkMode ? 
              "bg-[#010b29]/95 backdrop-blur-md border border-white/10" : 
              "bg-white/95 backdrop-blur-md border border-gray-200"
            }
          >
            <DropdownItem key="recent" className={isDarkMode ? 'text-white' : 'text-gray-800'}>{t('lookingForWork.sortBy.recent')}</DropdownItem>
            <DropdownItem key="salary-high" className={isDarkMode ? 'text-white' : 'text-gray-800'}>{t('lookingForWork.sortBy.salaryHigh')}</DropdownItem>
            <DropdownItem key="salary-low" className={isDarkMode ? 'text-white' : 'text-gray-800'}>{t('lookingForWork.sortBy.salaryLow')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card 
              className={`${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} border-none card-hover ${!isDarkMode && 'border border-gray-200'}`}
              isPressable
              onPress={() => handleViewJobDetails(job.id)}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center`}>
                    <img 
                      src={job.logo} 
                      alt={job.company}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{job.title}</h3>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{job.company}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Chip 
                        size="sm"
                        className={isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
                      >
                        {job.type}
                      </Chip>
                      <Chip 
                        size="sm"
                        className={isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
                      >
                        {job.location}
                      </Chip>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-beamly-secondary font-bold">{job.salary}</div>
                    <div className={isDarkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>{job.posted}</div>
                  </div>
                </div>
                
                <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {job.description}
                </p>
                
                <div className="flex justify-between items-center mt-4">
                  <Button 
                    variant="light"
                    size="sm"
                    className={isDarkMode ? 'text-white' : 'text-gray-800'}
                    startContent={<Icon icon="lucide:bookmark" />}
                    onPress={() => {
                      console.log("Save job button clicked");
                      // No navigation, just a log
                    }}
                  >
                    {t('lookingForWork.jobCard.save')}
                  </Button>
                  <Button 
                    color="secondary"
                    size="sm"
                    className="text-beamly-third font-medium"
                    onPress={() => handleViewJobDetails(job.id)}
                  >
                    {t('lookingForWork.jobCard.viewDetails')}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {filteredJobs.length === 0 && (
        <div className={`text-center py-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <Icon icon="lucide:search" className="mx-auto mb-4 text-4xl text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">{t('lookingForWork.noJobsFound.title')}</h3>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{t('lookingForWork.noJobsFound.description')}</p>
        </div>
      )}
      
      {filteredJobs.length > 0 && (
        <div className="flex justify-center mt-10">
          <Button 
            color="primary"
            variant="bordered"
            className={isDarkMode ? "text-white border-white/30" : "text-beamly-primary border-beamly-primary/30"}
            onPress={() => {
              console.log("Load more jobs button clicked");
              // No navigation, just a log
            }}
          >
            {t('lookingForWork.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};