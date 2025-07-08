import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Progress, Select, SelectItem } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AnalyticsData {
  totalEarnings: number;
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  avgRating: number;
  totalProposals: number;
  acceptedProposals: number;
  monthlyEarnings: Array<{ month: string; amount: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
}

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last30days');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEarnings: 0,
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    avgRating: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    monthlyEarnings: [],
    categoryBreakdown: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchAnalytics();
    }
  }, [user, navigate, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch jobs data
      const jobsQuery = query(
        collection(db, userData?.userType === 'client' ? 'jobs' : 'proposals'),
        where(userData?.userType === 'client' ? 'clientId' : 'freelancerId', '==', user.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      
      let totalJobs = 0;
      let completedJobs = 0;
      let activeJobs = 0;
      const categoryMap = new Map<string, number>();
      
      jobsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalJobs++;
        
        if (data.status === 'completed') {
          completedJobs++;
        } else if (data.status === 'active' || data.status === 'in-progress') {
          activeJobs++;
        }
        
        // Count categories
        const category = data.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      
      // Convert category map to array
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      
      // Generate mock monthly earnings data
      const monthlyEarnings = generateMonthlyData();
      
      setAnalyticsData({
        totalEarnings: userData?.totalEarnings || 0,
        totalJobs,
        completedJobs,
        activeJobs,
        avgRating: userData?.rating || 0,
        totalProposals: userData?.userType === 'freelancer' ? totalJobs : 0,
        acceptedProposals: userData?.userType === 'freelancer' ? activeJobs : 0,
        monthlyEarnings,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 5000) + 1000
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const completedPercentage = analyticsData.totalJobs > 0 
    ? ((analyticsData.completedJobs / analyticsData.totalJobs) * 100).toFixed(0)
    : '0';

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <Select
            label="Time Range"
            selectedKeys={[timeRange]}
            onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
            className="w-48"
            variant="bordered"
          >
            <SelectItem key="last7days" value="last7days">Last 7 days</SelectItem>
            <SelectItem key="last30days" value="last30days">Last 30 days</SelectItem>
            <SelectItem key="last90days" value="last90days">Last 90 days</SelectItem>
            <SelectItem key="lastyear" value="lastyear">Last year</SelectItem>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:dollar-sign" className="text-green-400" width={32} />
                <span className="text-green-400 text-sm">+12.5%</span>
              </div>
              <h3 className="text-gray-400 text-sm">Total Earnings</h3>
              <p className="text-2xl font-bold text-white">${analyticsData.totalEarnings.toLocaleString()}</p>
            </CardBody>
          </Card>

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:briefcase" className="text-blue-400" width={32} />
                <span className="text-blue-400 text-sm">+8%</span>
              </div>
              <h3 className="text-gray-400 text-sm">Total {userData?.userType === 'client' ? 'Jobs Posted' : 'Proposals'}</h3>
              <p className="text-2xl font-bold text-white">{analyticsData.totalJobs}</p>
            </CardBody>
          </Card>

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:check-circle" className="text-purple-400" width={32} />
                <span className="text-purple-400 text-sm">{completedPercentage}%</span>
              </div>
              <h3 className="text-gray-400 text-sm">Completed</h3>
              <p className="text-2xl font-bold text-white">{analyticsData.completedJobs}</p>
            </CardBody>
          </Card>

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:star" className="text-yellow-400" width={32} />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon 
                      key={star} 
                      icon="lucide:star" 
                      className={star <= Math.round(analyticsData.avgRating) ? "text-yellow-400" : "text-gray-600"} 
                      width={16} 
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Average Rating</h3>
              <p className="text-2xl font-bold text-white">{analyticsData.avgRating.toFixed(1)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Chart */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Earnings Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <Icon icon="lucide:line-chart" className="text-gray-400 mb-2" width={48} />
                  <p className="text-gray-400">Chart visualization available in pro version</p>
                </div>
              </div>
              {/* Display data as list for now */}
              <div className="mt-4 space-y-2">
                {analyticsData.monthlyEarnings.slice(0, 3).map((data) => (
                  <div key={data.month} className="flex justify-between text-sm">
                    <span className="text-gray-400">{data.month}</span>
                    <span className="text-white">${data.amount}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Category Breakdown */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {analyticsData.categoryBreakdown.map((category, index) => (
                  <div key={category.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300 text-sm">{category.name}</span>
                      <span className="text-white text-sm">{category.value}</span>
                    </div>
                    <Progress 
                      value={(category.value / analyticsData.totalJobs) * 100} 
                      color={index === 0 ? "primary" : index === 1 ? "secondary" : "success"}
                      size="sm"
                    />
                  </div>
                ))}
                {analyticsData.categoryBreakdown.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No data available yet</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Success Rate */}
        {userData?.userType === 'freelancer' && (
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Proposal Success Rate</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Acceptance Rate</span>
                    <span className="text-white">
                      {analyticsData.totalProposals > 0 
                        ? `${((analyticsData.acceptedProposals / analyticsData.totalProposals) * 100).toFixed(0)}%`
                        : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={analyticsData.totalProposals > 0 
                      ? (analyticsData.acceptedProposals / analyticsData.totalProposals) * 100
                      : 0} 
                    color="success"
                    className="mb-4"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{analyticsData.totalProposals}</p>
                    <p className="text-gray-400 text-sm">Total Proposals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{analyticsData.acceptedProposals}</p>
                    <p className="text-gray-400 text-sm">Accepted</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      {analyticsData.totalProposals - analyticsData.acceptedProposals}
                    </p>
                    <p className="text-gray-400 text-sm">Pending/Rejected</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;