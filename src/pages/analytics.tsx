import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Select, SelectItem, Progress } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AnalyticsData {
  totalEarnings?: number; // Only for freelancers
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  totalProposals: number;
  acceptedProposals: number;
  monthlyEarnings?: { month: string; amount: number }[]; // Only for freelancers
  categoryBreakdown: { name: string; value: number }[];
}

const AnalyticsPage: React.FC = () => {
  const { user, userData } = useAuth();
  const [timeRange, setTimeRange] = useState('last30days');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalJobs: 0,
    completedJobs: 0,
    avgRating: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    categoryBreakdown: []
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  // Add chart animation styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes growBar {
        from {
          height: 0;
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      .chart-bar {
        animation: growBar 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Helper function to get date range based on selected time range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeRange) {
      case 'last7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'lastyear':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  };

  // Function to calculate monthly earnings from actual payments
  const calculateMonthlyEarnings = async (userId: string) => {
    const { startDate, endDate } = getDateRange();
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize months with 0 values
    const months = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = 0;
      months.push(monthKey);
      current.setMonth(current.getMonth() + 1);
    }
    
    try {
      // Fetch actual payments for the freelancer (using 'payments' collection as per rules)
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('recipientId', '==', userId),
        where('status', '==', 'completed'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      console.log(`Found ${paymentsSnapshot.size} payments for user ${userId}`);
      
      // Calculate earnings per month from real payments
      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        const date = payment.createdAt.toDate();
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (monthlyData[monthKey] !== undefined) {
          // Use amount from payment
          const amount = payment.amount || 0;
          monthlyData[monthKey] += amount;
        }
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
    
    // Convert to array format for display
    // Show only last 6 months for the chart
    const sortedMonths = months.slice(-6);
    return sortedMonths.map(month => ({
      month: month.split(' ')[0], // Just the month abbreviation
      amount: Math.round(monthlyData[month] || 0)
    }));
  };

  const fetchAnalytics = async () => {
    if (!user || !userData) return;
    
    setLoading(true);
    console.log('Fetching analytics for user:', user.uid, 'UserType:', userData.userType);
    
    try {
      let totalEarnings = 0;
      let totalJobs = 0;
      let completedJobs = 0;
      let totalProposals = 0;
      let acceptedProposals = 0;
      const categoryMap: { [key: string]: number } = {};
      let monthlyEarnings = undefined;

      if (userData.userType === 'freelancer' || userData.userType === 'both') {
        // Fetch all freelancer proposals
        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('freelancerId', '==', user.uid)
        );
        
        const proposalsSnapshot = await getDocs(proposalsQuery);
        console.log('Proposals found:', proposalsSnapshot.size);
        
        proposalsSnapshot.forEach((doc) => {
          const proposal = doc.data();
          totalProposals++;
          if (proposal.status === 'accepted') {
            acceptedProposals++;
            completedJobs++;
          }
        });
        
        // Use completedProjects from userData if available
        totalJobs = userData.completedProjects || completedJobs;
        completedJobs = userData.completedProjects || completedJobs;
        
        // Calculate actual total earnings from payments collection
        const { startDate, endDate } = getDateRange();
        const earningsQuery = query(
          collection(db, 'payments'),
          where('recipientId', '==', user.uid),
          where('status', '==', 'completed'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'desc')
        );
        
        try {
          const earningsSnapshot = await getDocs(earningsQuery);
          console.log('Payments found:', earningsSnapshot.size);
          
          earningsSnapshot.forEach((doc) => {
            const payment = doc.data();
            const amount = payment.amount || 0;
            totalEarnings += amount;
            console.log('Payment amount:', amount);
          });
        } catch (error) {
          console.error('Error fetching payments:', error);
          // If payments query fails, use userData totalEarnings as fallback
          totalEarnings = userData.totalEarnings || 0;
        }
        
        // Get monthly earnings data
        monthlyEarnings = await calculateMonthlyEarnings(user.uid);
        console.log('Monthly earnings:', monthlyEarnings);

        // Fetch freelancer's projects for category breakdown
        try {
          const projectsQuery = query(
            collection(db, 'projects'),
            where('freelancerId', '==', user.uid)
          );
          
          const projectsSnapshot = await getDocs(projectsQuery);
          console.log('Projects found:', projectsSnapshot.size);
          
          projectsSnapshot.forEach((doc) => {
            const project = doc.data();
            if (project.category) {
              categoryMap[project.category] = (categoryMap[project.category] || 0) + 1;
            }
          });
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      }

      if (userData.userType === 'client' || userData.userType === 'both') {
        // Fetch client jobs
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        console.log('Jobs found:', jobsSnapshot.size);
        
        jobsSnapshot.forEach((doc) => {
          const job = doc.data();
          totalJobs++;
          if (job.status === 'completed') {
            completedJobs++;
          }
          
          // Category breakdown
          if (job.category) {
            categoryMap[job.category] = (categoryMap[job.category] || 0) + 1;
          }
        });

        // Also fetch proposals for clients
        const clientProposalsQuery = query(
          collection(db, 'proposals'),
          where('clientId', '==', user.uid)
        );
        
        try {
          const clientProposalsSnapshot = await getDocs(clientProposalsQuery);
          console.log('Client proposals found:', clientProposalsSnapshot.size);
          
          clientProposalsSnapshot.forEach((doc) => {
            const proposal = doc.data();
            totalProposals++;
            if (proposal.status === 'accepted') {
              acceptedProposals++;
            }
          });
        } catch (error) {
          console.error('Error fetching client proposals:', error);
        }
      }

      // Convert category map to array
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Prepare final data
      const finalData = {
        totalEarnings: userData.userType !== 'client' ? Math.round(totalEarnings) : undefined,
        monthlyEarnings: userData.userType !== 'client' ? (monthlyEarnings || []) : undefined,
        totalJobs: totalJobs || 0,
        completedJobs: completedJobs || 0,
        avgRating: userData.rating || 0,
        totalProposals,
        acceptedProposals,
        categoryBreakdown
      };
      
      console.log('Final analytics data:', finalData);
      setAnalyticsData(finalData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set fallback data from userData if available
      setAnalyticsData({
        totalEarnings: userData.userType !== 'client' ? (userData.totalEarnings || 0) : undefined,
        monthlyEarnings: userData.userType !== 'client' ? [] : undefined,
        totalJobs: userData.completedProjects || 0,
        completedJobs: userData.completedProjects || 0,
        avgRating: userData.rating || 0,
        totalProposals: 0,
        acceptedProposals: 0,
        categoryBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  };

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
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Time Range</span>
                    <Select
                      selectedKeys={[timeRange]}
                      onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
                      className="w-48"
                      variant="bordered"
                      size="sm"
                      classNames={{
                        trigger: "h-10 bg-gray-900/50 border-gray-600",
                        value: "text-white text-sm",
                        listbox: "bg-gray-900",
                        popoverContent: "bg-gray-900 border border-gray-700",
                      }}
                    >
                      <SelectItem key="last7days" value="last7days">Last 7 days</SelectItem>
                      <SelectItem key="last30days" value="last30days">Last 30 days</SelectItem>
                      <SelectItem key="last90days" value="last90days">Last 90 days</SelectItem>
                      <SelectItem key="lastyear" value="lastyear">Last year</SelectItem>
                    </Select>
                  </div>
                </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsData.totalEarnings !== undefined && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <Icon icon="lucide:dollar-sign" className="text-green-400 flex-shrink-0" width={32} />
                  <span className="text-green-400 text-sm ml-2">
                    {analyticsData.totalEarnings > 0 ? '↑' : '—'}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-gray-400 text-sm mb-1">Total Earnings</h3>
                  <p className="text-2xl font-bold text-white">${analyticsData.totalEarnings.toLocaleString()}</p>
                </div>
              </CardBody>
            </Card>
          )}

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-2">
                <Icon icon="lucide:briefcase" className="text-blue-400 flex-shrink-0" width={32} />
                <span className="text-blue-400 text-sm ml-2">{completedPercentage}%</span>
              </div>
              <div className="mt-4">
                <h3 className="text-gray-400 text-sm mb-1">
                  Total {userData?.userType === 'client' ? 'Jobs Posted' : 'Projects'}
                </h3>
                <p className="text-2xl font-bold text-white">{analyticsData.totalJobs}</p>
              </div>
            </CardBody>
          </Card>

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="mb-2">
                <Icon icon="lucide:check-circle" className="text-purple-400 mb-2" width={32} />
                <Progress 
                  value={parseFloat(completedPercentage)} 
                  size="sm" 
                  color="secondary"
                  className="w-full"
                  aria-label="Completion percentage"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-gray-400 text-sm mb-1">Completed</h3>
                <p className="text-2xl font-bold text-white">{analyticsData.completedJobs}</p>
              </div>
            </CardBody>
          </Card>

          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="mb-2">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Icon 
                      key={i} 
                      icon={i < Math.floor(analyticsData.avgRating) ? "lucide:star" : "lucide:star-outline"} 
                      className={i < Math.floor(analyticsData.avgRating) ? "text-yellow-400" : "text-gray-600"} 
                      width={20} 
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-gray-400 text-sm mb-1">Average Rating</h3>
                <p className="text-2xl font-bold text-white">{analyticsData.avgRating.toFixed(1)}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Chart - Only for freelancers */}
          {analyticsData.monthlyEarnings && analyticsData.monthlyEarnings.length > 0 && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Earnings Over Time</h3>
                <div className="h-64 flex flex-col justify-end bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-end justify-around h-full gap-2">
                    {analyticsData.monthlyEarnings.map((data, index) => {
                      const maxAmount = Math.max(...analyticsData.monthlyEarnings!.map(d => d.amount), 1);
                      const heightPercentage = (data.amount / maxAmount) * 100;
                      
                      return (
                        <div key={`${data.month}-${index}`} className="flex-1 flex flex-col items-center justify-end">
                          <div className="relative w-full flex flex-col items-center">
                            <span className="text-xs text-white mb-1">
                              ${data.amount > 1000 ? `${(data.amount/1000).toFixed(1)}k` : data.amount}
                            </span>
                            <div 
                              className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-500 chart-bar"
                              style={{ 
                                height: `${Math.max(heightPercentage * 1.5, 10)}px`,
                                opacity: heightPercentage > 0 ? 1 : 0.3
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 mt-2">{data.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Show placeholder if freelancer but no earnings data */}
          {userData?.userType !== 'client' && (!analyticsData.monthlyEarnings || analyticsData.monthlyEarnings.length === 0) && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Earnings Over Time</h3>
                <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <Icon icon="lucide:line-chart" className="text-gray-400 mb-2" width={48} />
                    <p className="text-gray-400">No earnings data available yet</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Category Breakdown</h3>
              {analyticsData.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.categoryBreakdown.map((category, index) => {
                    const colors = ['primary', 'secondary', 'success', 'warning', 'danger'] as const;
                    const percentage = analyticsData.totalJobs > 0 
                      ? (category.value / analyticsData.totalJobs) * 100 
                      : 0;
                    
                    return (
                      <div key={category.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300 text-sm">{category.name}</span>
                          <span className="text-white text-sm">
                            {category.value} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          color={colors[index % colors.length]}
                          size="sm"
                          aria-label={`${category.name} completion percentage`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 text-center">No data available yet</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Success Rate */}
        {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
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
                    aria-label="Proposal acceptance rate"
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