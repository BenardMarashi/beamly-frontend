import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Input, Button, Select, SelectItem, Chip, Avatar } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface ExploreItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  priceType?: string;
  skills?: string[];
  createdBy: string;
  createdByName?: string;
  createdByPhoto?: string;
  createdAt: any;
  type: 'job' | 'project';
  budget?: number;
  duration?: string;
  experienceLevel?: string;
}

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'job' | 'project'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchItems();
  }, [filterType, filterCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const itemsData: ExploreItem[] = [];
      
      // Fetch jobs
      if (filterType === 'all' || filterType === 'job') {
        let jobsQuery = query(
          collection(db, 'jobs'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        if (filterCategory !== 'all') {
          jobsQuery = query(jobsQuery, where('category', '==', filterCategory));
        }
        
        const jobsSnapshot = await getDocs(jobsQuery);
        jobsSnapshot.forEach((doc) => {
          // FIXED: Properly handle Firestore document data
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            type: 'job' as const,
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            budget: data.budget || 0,
            duration: data.duration || '',
            experienceLevel: data.experienceLevel || '',
            skills: data.skills || [],
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || '',
            createdByPhoto: data.createdByPhoto || '',
            createdAt: data.createdAt
          });
        });
      }
      
      // Fetch projects
      if (filterType === 'all' || filterType === 'project') {
        let projectsQuery = query(
          collection(db, 'projects'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        if (filterCategory !== 'all') {
          projectsQuery = query(projectsQuery, where('category', '==', filterCategory));
        }
        
        const projectsSnapshot = await getDocs(projectsQuery);
        projectsSnapshot.forEach((doc) => {
          // FIXED: Properly handle Firestore document data
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            type: 'project' as const,
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            price: data.price || 0,
            priceType: data.priceType || 'fixed',
            skills: data.skills || [],
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || '',
            createdByPhoto: data.createdByPhoto || '',
            createdAt: data.createdAt
          });
        });
      }
      
      // Sort by creation date
      itemsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

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
                  onChange={(e) => setFilterType(e.target.value as any)}
                  placeholder="Type"
                  classNames={{
                    trigger: "bg-white/50 dark:bg-gray-800/50"
                  }}
                >
                  <SelectItem key="all" value="all">All Types</SelectItem>
                  <SelectItem key="job" value="job">Jobs</SelectItem>
                  <SelectItem key="project" value="project">Projects</SelectItem>
                </Select>
                
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  placeholder="Category"
                  classNames={{
                    trigger: "bg-white/50 dark:bg-gray-800/50"
                  }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </Select>
                
                <Button
                  color="primary"
                  onPress={fetchItems}
                  startContent={<Icon icon="lucide:filter" />}
                >
                  Apply Filters
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Icon icon="lucide:search-x" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="glass-effect hover:shadow-xl transition-shadow cursor-pointer h-full"
                  isPressable
                  onPress={() => handleItemClick(item)}
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Chip
                        color={item.type === 'job' ? 'primary' : 'secondary'}
                        variant="flat"
                        size="sm"
                      >
                        {item.type === 'job' ? 'Job' : 'Project'}
                      </Chip>
                      <Chip variant="flat" size="sm">
                        {item.category}
                      </Chip>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {item.description}
                    </p>
                    
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.skills.slice(0, 3).map((skill, idx) => (
                          <Chip key={idx} size="sm" variant="flat">
                            {skill}
                          </Chip>
                        ))}
                        {item.skills.length > 3 && (
                          <Chip size="sm" variant="flat">
                            +{item.skills.length - 3}
                          </Chip>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={item.createdByPhoto}
                          name={item.createdByName}
                          size="sm"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.createdByName}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        {item.type === 'job' && item.budget && (
                          <p className="font-semibold">${item.budget}</p>
                        )}
                        {item.type === 'project' && item.price && (
                          <p className="font-semibold">
                            ${item.price}
                            {item.priceType === 'hourly' && '/hr'}
                          </p>
                        )}
                      </div>
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