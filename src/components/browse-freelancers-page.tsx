import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

interface BrowseFreelancersPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const BrowseFreelancersPage: React.FC<BrowseFreelancersPageProps> = ({ 
  setCurrentPage,
  isDarkMode = true
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("rating");
  
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "design", name: "Design" },
    { id: "development", name: "Development" },
    { id: "marketing", name: "Marketing" },
    { id: "writing", name: "Writing" },
    { id: "video", name: "Video & Animation" }
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
  }, [freelancers, filterCategory, searchQuery, sortBy]);

  // Fix the navigation function
  const handleViewProfile = (id: number) => {
    // Instead of just changing page name, use proper routing with ID
    if (typeof window !== 'undefined') {
      navigate(`/freelancer/${id}`);
    } else {
      setCurrentPage(`freelancer-profile`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Browse Freelancers</h1>
      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Find talented professionals for your projects</p>
      
      <div className="glass-effect p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search for freelancers by name or skill..."
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
              console.log("Search freelancers button clicked");
              // No navigation, just a log
            }}
          >
            Search
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
              Sort by: {
                sortBy === "rating" ? "Highest Rated" : 
                sortBy === "projects" ? "Most Projects" : 
                sortBy === "price-low" ? "Lowest Rate" : "Highest Rate"
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
            <DropdownItem key="rating" className={isDarkMode ? 'text-white' : 'text-gray-800'}>Highest Rated</DropdownItem>
            <DropdownItem key="projects" className={isDarkMode ? 'text-white' : 'text-gray-800'}>Most Projects</DropdownItem>
            <DropdownItem key="price-low" className={isDarkMode ? 'text-white' : 'text-gray-800'}>Lowest Rate</DropdownItem>
            <DropdownItem key="price-high" className={isDarkMode ? 'text-white' : 'text-gray-800'}>Highest Rate</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar 
                    src={freelancer.avatar} 
                    className="w-16 h-16"
                  />
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{freelancer.name}</h3>
                    <p className="text-gray-400 text-sm">{freelancer.title}</p>
                    <div className="flex items-center mt-1">
                      <Icon icon="lucide:star" className="text-beamly-secondary mr-1" />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>{freelancer.rating}</span>
                      <span className="text-gray-400 text-xs ml-2">({freelancer.projectsCompleted} projects)</span>
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
                      <span className="text-beamly-secondary font-bold">{freelancer.hourlyRate}</span>
                      <span className="text-gray-400 text-xs ml-1">/ hr</span>
                    </div>
                    <Button 
                      color="secondary"
                      size="sm"
                      className="text-beamly-third font-medium"
                      onPress={() => handleViewProfile(freelancer.id)}
                    >
                      View Profile
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
          <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
      
      {filteredFreelancers.length > 0 && (
        <div className="flex justify-center mt-10">
          <Button 
            color="primary"
            variant="bordered"
            className={isDarkMode ? "text-white border-white/30" : "text-beamly-primary border-beamly-primary/30"}
            onPress={() => {
              console.log("Load more button clicked");
              // No navigation, just a log
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};