import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Input, 
  Button, 
  Card, 
  CardBody, 
  Avatar, 
  Chip, 
  Select, 
  SelectItem,
  Skeleton 
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { collection, query, where, orderBy, limit, getDocs, DocumentSnapshot, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

export const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'video', label: 'Video & Animation' },
    { value: 'music', label: 'Music & Audio' },
    { value: 'business', label: 'Business' },
  ];
  
  useEffect(() => {
    fetchFreelancers(true);
  }, [selectedCategory, sortBy]);
  
  const fetchFreelancers = async (reset = false) => {
    setLoading(true);
    try {
      let freelancersQuery = query(
        collection(db, "users"),
        where("userType", "in", ["freelancer", "both"])
      );
      
      // Add category filter if not "all"
      if (selectedCategory !== 'all') {
        freelancersQuery = query(
          freelancersQuery,
          where("skills", "array-contains-any", getCategorySkills(selectedCategory))
        );
      }
      
      // Add sorting
      if (sortBy === 'rating') {
        freelancersQuery = query(freelancersQuery, orderBy("rating", "desc"));
      } else if (sortBy === 'projects') {
        freelancersQuery = query(freelancersQuery, orderBy("completedProjects", "desc"));
      } else if (sortBy === 'newest') {
        freelancersQuery = query(freelancersQuery, orderBy("createdAt", "desc"));
      }
      
      // Add pagination
      freelancersQuery = query(freelancersQuery, limit(12));
      
      if (!reset && lastDoc) {
        freelancersQuery = query(freelancersQuery, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(freelancersQuery);
      const newFreelancers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (reset) {
        setFreelancers(newFreelancers);
      } else {
        setFreelancers(prev => [...prev, ...newFreelancers]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 12);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCategorySkills = (category: string) => {
    const skillsMap: { [key: string]: string[] } = {
      design: ["UI Design", "UX Design", "Graphic Design", "Web Design", "Logo Design"],
      development: ["JavaScript", "React", "Python", "Node.js", "WordPress", "PHP"],
      writing: ["Content Writing", "Copywriting", "Blog Writing", "Technical Writing"],
      marketing: ["SEO", "Social Media", "Google Ads", "Email Marketing", "Marketing Strategy"],
      video: ["Video Editing", "Animation", "Motion Graphics", "After Effects"],
      music: ["Music Production", "Audio Editing", "Voice Over", "Sound Design"],
      business: ["Business Analysis", "Project Management", "Data Analysis", "Consulting"]
    };
    return skillsMap[category] || [];
  };
  
  const filteredFreelancers = React.useMemo(() => {
    if (!searchQuery.trim()) return freelancers;
    
    return freelancers.filter(freelancer => {
      const searchLower = searchQuery.toLowerCase();
      return (
        freelancer.displayName?.toLowerCase().includes(searchLower) ||
        freelancer.bio?.toLowerCase().includes(searchLower) ||
        freelancer.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))
      );
    });
  }, [freelancers, searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchFreelancers(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">{t('browseFreelancers.title')}</h1>
        
        {/* Search and Filters */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              size="lg"
              variant="bordered"
              placeholder={t('browseFreelancers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/10"
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            />
            <Select
              variant="bordered"
              selectedKeys={[selectedCategory]}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="md:w-48 bg-white/10"
              aria-label="Category filter"
            >
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              variant="bordered"
              selectedKeys={[sortBy]}
              onChange={(e) => setSortBy(e.target.value)}
              className="md:w-48 bg-white/10"
              aria-label="Sort by"
            >
              <SelectItem key="rating" value="rating">Highest Rated</SelectItem>
              <SelectItem key="projects" value="projects">Most Projects</SelectItem>
              <SelectItem key="newest" value="newest">Newest</SelectItem>
            </Select>
          </div>
        </div>
        
        {/* Freelancers Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="glass-card">
                <CardBody className="p-4">
                  <Skeleton className="rounded-full w-16 h-16 mx-auto mb-3" />
                  <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredFreelancers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFreelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="glass-card card-hover h-full"
                    isPressable
                    onPress={() => navigate(`/freelancers/${freelancer.id}`)}
                  >
                    <CardBody className="p-4">
                      <div className="text-center">
                        <Avatar
                          src={freelancer.photoURL || `https://ui-avatars.com/api/?name=${freelancer.displayName}&background=0F43EE&color=fff`}
                          className="w-16 h-16 mx-auto mb-3"
                          name={freelancer.displayName}
                        />
                        <h3 className="font-semibold text-white mb-1">
                          {freelancer.displayName}
                        </h3>
                        <p className="text-beamly-secondary text-sm mb-2">
                          {freelancer.skills?.[0] || 'Freelancer'}
                        </p>
                        <div className="flex items-center justify-center mb-3">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon 
                                key={star} 
                                icon="lucide:star" 
                                className={star <= Math.round(freelancer.rating || 0) ? "text-yellow-400" : "text-gray-400"} 
                                width={14} 
                              />
                            ))}
                          </div>
                          <span className="text-gray-300 text-xs ml-1">
                            {freelancer.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mb-3">
                          <span className="text-gray-400">Projects:</span>
                          <span className="text-white font-medium">
                            {freelancer.completedProjects || 0}
                          </span>
                        </div>
                        {freelancer.hourlyRate && (
                          <div className="text-beamly-secondary font-bold mb-3">
                            ${freelancer.hourlyRate}/hr
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 justify-center">
                          {freelancer.skills?.slice(0, 3).map((skill: string) => (
                            <Chip 
                              key={skill} 
                              size="sm" 
                              variant="flat" 
                              color="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Chip>
                          ))}
                          {freelancer.skills?.length > 3 && (
                            <Chip 
                              size="sm" 
                              variant="flat" 
                              color="default"
                              className="text-xs"
                            >
                              +{freelancer.skills.length - 3}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={handleLoadMore}
                  isLoading={loading}
                  className="font-medium"
                >
                  Load More Freelancers
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="glass-card">
            <CardBody className="p-12 text-center">
              <Icon icon="lucide:users-x" className="mx-auto mb-4 text-gray-400" width={64} />
              <h3 className="text-xl font-semibold text-white mb-2">No Freelancers Found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery 
                  ? `No freelancers match "${searchQuery}"`
                  : "No freelancers available in this category yet"}
              </p>
              <Button
                color="secondary"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </CardBody>
          </Card>
        )}
      </motion.div>
    </div>
  );
};