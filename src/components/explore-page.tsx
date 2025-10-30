import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Input, Select, SelectItem, Chip, Avatar } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

interface ExploreItem {
  id: string;
  type: 'job' | 'project';
  title: string;
  description: string;
  imageUrl?: string;
  budget?: string;
  skills?: string[];
  technologies?: string[];
  category?: string;
  postedBy?: string;
  createdBy?: string;
  postedAt?: any;
  createdAt?: any;
  likes?: number;
  views?: number;
  proposals?: number;
}

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "web-development", label: "Web Development" },
    { value: "mobile-development", label: "Mobile Development" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "writing", label: "Writing & Translation" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "video-animation", label: "Video & Animation" },
    { value: "data-science", label: "Data Science" },
    { value: "business", label: "Business" }
  ];

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, filterCategory, sortBy]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const itemsData: ExploreItem[] = [];
      
      // Fetch only jobs if filterType is 'job' or 'all'
      if (filterType === 'job' || filterType === 'all') {
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        
        jobsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            type: 'job',
            title: data.title,
            description: data.description,
            budget: data.budget || data.budgetRange || (data.budgetMin && data.budgetMax ? `$${data.budgetMin} - $${data.budgetMax}` : 'Negotiable'),
            skills: data.skills || [],
            category: data.category,
            postedBy: data.clientName || 'Client',
            postedAt: data.createdAt,
            proposals: data.proposalsCount || 0
          });
        });
      }
      
      // Fetch only projects if filterType is 'project' or 'all'
      if (filterType === 'project' || filterType === 'all') {
        const projectsQuery = query(
          collection(db, 'projects'),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        
        projectsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            type: 'project',
            title: data.title,
            description: data.description,
            imageUrl: data.thumbnailUrl || data.images?.[0],
            skills: data.skills || [],
            technologies: data.technologies || [],
            category: data.category,
            createdBy: data.freelancerName || 'Freelancer',
            createdAt: data.createdAt,
            likes: data.likeCount || 0,
            views: data.viewCount || 0
          });
        });
      }
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.type === 'job') {
          return (
            item.title.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
            item.category?.toLowerCase().includes(searchLower)
          );
        } else if (item.type === 'project') {
          return (
            item.title.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
            item.technologies?.some(tech => tech.toLowerCase().includes(searchLower)) ||
            item.category?.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          const aTime = a.createdAt?.toMillis?.() || a.postedAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.postedAt?.toMillis?.() || 0;
          return bTime - aTime;
        case "popular":
          if (a.type === 'project' && b.type === 'project') {
            return (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0));
          }
          return (b.proposals || 0) - (a.proposals || 0);
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const handleItemClick = (item: ExploreItem) => {
    if (item.type === 'job') {
      navigate(`/job/${item.id}`);
    } else {
      navigate(`/project/${item.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Explore Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-400">Find the perfect job or project for your skills</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or skills..."
                  startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white/50 dark:bg-gray-800/50"
                  }}
                />
                
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                  classNames={{
                    trigger: "bg-white/50 dark:bg-gray-800/50"
                  }}
                >
                  <SelectItem key="all" value="all">All Types</SelectItem>
                  <SelectItem key="job" value="job">Jobs Only</SelectItem>
                  <SelectItem key="project" value="project">Projects Only</SelectItem>
                </Select>
                
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                  classNames={{
                    trigger: "bg-white/50 dark:bg-gray-800/50"
                  }}
                >
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </Select>
                
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                  classNames={{
                    trigger: "bg-white/50 dark:bg-gray-800/50"
                  }}
                >
                  <SelectItem key="recent" value="recent">Most Recent</SelectItem>
                  <SelectItem key="popular" value="popular">Most Popular</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-effect animate-pulse">
                <CardBody className="p-6">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="glass-effect">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:search-x" className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer"
              >
                <Card className="glass-effect hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon 
                            icon={item.type === 'job' ? 'lucide:briefcase' : 'lucide:folder'} 
                            className="text-xl text-primary"
                          />
                          <Chip 
                            size="sm" 
                            color={item.type === 'job' ? 'primary' : 'success'}
                            variant="flat"
                          >
                            {item.type}
                          </Chip>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>
                    
                    {(item.skills?.length || item.technologies?.length) ? (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {[...(item.skills || []), ...(item.technologies || [])].slice(0, 3).map((skill, idx) => (
                          <Chip key={idx} size="sm" variant="flat" className="bg-gray-100 dark:bg-gray-800">
                            {skill}
                          </Chip>
                        ))}
                      </div>
                    ) : null}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        {item.budget && (
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:dollar-sign" />
                            {item.budget}
                          </span>
                        )}
                        {item.type === 'job' && item.proposals !== undefined && (
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:users" />
                            {item.proposals} proposals
                          </span>
                        )}
                        {item.type === 'project' && (
                          <>
                            {item.likes !== undefined && (
                              <span className="flex items-center gap-1">
                                <Icon icon="lucide:heart" />
                                {item.likes}
                              </span>
                            )}
                            {item.views !== undefined && (
                              <span className="flex items-center gap-1">
                                <Icon icon="lucide:eye" />
                                {item.views}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-xs">
                        by {item.postedBy || item.createdBy}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};