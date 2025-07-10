import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Chip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface BrowseFreelancersPageProps {
  setCurrentPage?: (page: string) => void;
}

export const BrowseFreelancersPage: React.FC<BrowseFreelancersPageProps> = ({ 
  setCurrentPage
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("rating");
  
  const categories = [
    { id: "all", name: t('browseFreelancers.allCategories') },
    { id: "design", name: t('categories.items.graphicDesign') },
    { id: "development", name: t('categories.items.webDevelopment') },
    { id: "marketing", name: t('categories.items.digitalMarketing') },
    { id: "writing", name: t('categories.items.writingTranslation') },
    { id: "video", name: t('categories.items.videoAnimation') }
  ];
  
  const freelancers = [
    {
      id: 1,
      name: "Ophelia Coleman",
      title: "UI/UX Designer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=ophelia1",
      rating: 4.9,
      projectsCompleted: 87,
      hourlyRate: "$45",
      category: "design",
      skills: ["UI Design", "UX Research", "Figma"]
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Full Stack Developer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=michael1",
      rating: 4.8,
      projectsCompleted: 124,
      hourlyRate: "$65",
      category: "development",
      skills: ["React", "Node.js", "MongoDB"]
    },
    {
      id: 3,
      name: "Sarah Johnson",
      title: "Content Writer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=sarah1",
      rating: 4.7,
      projectsCompleted: 93,
      hourlyRate: "$35",
      category: "writing",
      skills: ["Blog Posts", "SEO Writing", "Copywriting"]
    },
    {
      id: 4,
      name: "David Wilson",
      title: "Digital Marketer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=david1",
      rating: 4.9,
      projectsCompleted: 112,
      hourlyRate: "$50",
      category: "marketing",
      skills: ["SEO", "Social Media", "Google Ads"]
    },
    {
      id: 5,
      name: "Emma Phillips",
      title: "Video Editor",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=emma1",
      rating: 4.8,
      projectsCompleted: 76,
      hourlyRate: "$55",
      category: "video",
      skills: ["After Effects", "Premiere Pro", "Motion Graphics"]
    },
    {
      id: 6,
      name: "Alex Rodriguez",
      title: "WordPress Developer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=alex1",
      rating: 4.7,
      projectsCompleted: 104,
      hourlyRate: "$40",
      category: "development",
      skills: ["WordPress", "PHP", "Theme Development"]
    },
    {
      id: 7,
      name: "Jessica Lee",
      title: "Graphic Designer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=jessica1",
      rating: 4.9,
      projectsCompleted: 131,
      hourlyRate: "$45",
      category: "design",
      skills: ["Photoshop", "Illustrator", "Brand Identity"]
    },
    {
      id: 8,
      name: "Robert Taylor",
      title: "SEO Specialist",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=robert1",
      rating: 4.8,
      projectsCompleted: 89,
      hourlyRate: "$60",
      category: "marketing",
      skills: ["Keyword Research", "Link Building", "Analytics"]
    }
  ];
  
  const filteredFreelancers = React.useMemo(() => {
    let result = freelancers;
    
    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter(freelancer => freelancer.category === filterCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(freelancer => 
        freelancer.name.toLowerCase().includes(query) || 
        freelancer.title.toLowerCase().includes(query) ||
        freelancer.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }
    
    // Sort
    switch (sortBy) {
      case "rating":
        return [...result].sort((a, b) => b.rating - a.rating);
      case "projects":
        return [...result].sort((a, b) => b.projectsCompleted - a.projectsCompleted);
      case "price-low":
        return [...result].sort((a, b) => 
          parseInt(a.hourlyRate.replace("$", "")) - parseInt(b.hourlyRate.replace("$", ""))
        );
      case "price-high":
        return [...result].sort((a, b) => 
          parseInt(b.hourlyRate.replace("$", "")) - parseInt(a.hourlyRate.replace("$", ""))
        );
      default:
        return result;
    }
  }, [filterCategory, searchQuery, sortBy]);

  const handleViewProfile = (id: number) => {
    // Use navigation if available, otherwise use setCurrentPage
    if (typeof window !== 'undefined' && navigate) {
      navigate(`/freelancer/${id}`);
    } else if (setCurrentPage) {
      setCurrentPage(`freelancer-profile`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-6 pb-20">
      <h1 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('browseFreelancers.title')}
      </h1>
      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 md:mb-6 text-sm md:text-base`}>
        {t('browseFreelancers.subtitle')}
      </p>
      
      <div className="glass-effect p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder={t('browseFreelancers.searchPlaceholder')}
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
              console.log("Search freelancers");
            }}
          >
            {t('common.search')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
              className={`${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-800'} text-sm`}
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              {t('browseFreelancers.sortBy')}: {
                sortBy === "rating" ? t('browseFreelancers.highestRated') : 
                sortBy === "projects" ? t('browseFreelancers.mostProjects') : 
                sortBy === "price-low" ? t('browseFreelancers.lowestRate') : t('browseFreelancers.highestRate')
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
            <DropdownItem key="rating" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('browseFreelancers.highestRated')}
            </DropdownItem>
            <DropdownItem key="projects" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('browseFreelancers.mostProjects')}
            </DropdownItem>
            <DropdownItem key="price-low" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('browseFreelancers.lowestRate')}
            </DropdownItem>
            <DropdownItem key="price-high" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              {t('browseFreelancers.highestRate')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredFreelancers.map((freelancer, index) => (
          <motion.div
            key={freelancer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card 
              className={`${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} border-none card-hover ${!isDarkMode && 'border border-gray-200'}`}
              isPressable
              onPress={() => handleViewProfile(freelancer.id)}
            >
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-3 md:gap-4">
                  <Avatar 
                    src={freelancer.avatar} 
                    className="w-14 h-14 md:w-16 md:h-16"
                  />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {freelancer.name}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm">{freelancer.title}</p>
                    <div className="flex items-center mt-1">
                      <Icon icon="lucide:star" className="text-beamly-secondary mr-1" />
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{freelancer.rating}</span>
                      <span className="text-gray-400 text-xs ml-2">({freelancer.projectsCompleted} {t('home.projects')?.toLowerCase() || 'projects'})</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {freelancer.skills.map((skill, i) => (
                      <Chip 
                        key={i} 
                        size="sm"
                        className={isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
                      >
                        {skill}
                      </Chip>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <span className="text-beamly-secondary font-bold text-sm md:text-base">{freelancer.hourlyRate}</span>
                      <span className="text-gray-400 text-xs ml-1">{t('browseFreelancers.perHour')}</span>
                    </div>
                    <Button 
                      color="secondary"
                      size="sm"
                      className="text-beamly-third font-medium"
                      onPress={() => handleViewProfile(freelancer.id)}
                    >
                      {t('browseFreelancers.viewProfile')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {filteredFreelancers.length === 0 && (
        <div className={`text-center py-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <Icon icon="lucide:search" className="mx-auto mb-4 text-4xl text-gray-400" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">{t('browseFreelancers.noFreelancersFound')}</h3>
          <p className="text-gray-400 text-sm md:text-base">{t('browseFreelancers.tryAdjusting')}</p>
        </div>
      )}
      
      {filteredFreelancers.length > 0 && (
        <div className="flex justify-center mt-8 md:mt-10">
          <Button 
            color="primary"
            variant="bordered"
            className={isDarkMode ? "text-white border-white/30" : "text-beamly-primary border-beamly-primary/30"}
            onPress={() => {
              console.log("Load more");
            }}
          >
            {t('browseFreelancers.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};