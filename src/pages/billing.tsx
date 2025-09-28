// src/pages/billing.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  useDisclosure,
  Tabs,
  Tab,
  Chip
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { StripeService } from '../services/stripe-service';
import { ProSubscription } from '../components/payments/ProSubscription';
import { StripeConnectOnboarding } from '../components/payments/StripeConnectOnboarding';

interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'subscription' | 'refund' | 'escrow' | 'release';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: any;
}

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<string>('earnings');
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState({
    hasAccount: false,
    isComplete: false
  });
  
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  

  useEffect(() => {
  const tabParam = searchParams.get('tab');
  if (tabParam === 'subscription') {
    setSelectedTab('subscription');
  } else if (tabParam === 'transactions') {
    setSelectedTab('transactions');
  } else {
    setSelectedTab('earnings');
  }
}, [searchParams]);
  // Redirect if user is client only
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Only allow freelancers and 'both' user types
    if (userData && userData.userType === 'client') {
      toast.error(t('billing.errors.freelancersOnly'));
      navigate('/dashboard');
      return;
    }
    
    if (userData && (userData.userType === 'freelancer' || userData.userType === 'both')) {
      fetchBillingData();
      checkConnectStatus();
      fetchBalance();
    }
  }, [user, userData, navigate]);
  
  const checkConnectStatus = async () => {
    if (!user?.uid) return;
    
    // Check if user has stripeConnectAccountId in their data
    const hasAccount = !!(userData as any)?.stripeConnectAccountId;
    
    if (hasAccount) {
      const result = await StripeService.getConnectAccountStatus(user.uid);
      if (result.success) {
        setConnectStatus({
          hasAccount: true,
          isComplete: result.chargesEnabled && result.payoutsEnabled
        });
      }
    }
  };
  
  const fetchBalance = async () => {
    if (!user?.uid) return;
    
    const result = await StripeService.getBalance(user.uid);
    if (result.success) {
      setBalance({
        available: result.available,
        pending: result.pending
      });
    }
  };
  
  const fetchBillingData = async () => {
    if (!user) return;
    
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData: Transaction[] = [];
      
      transactionsSnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      
      setTransactions(transactionsData);
      
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error(t('billing.errors.loadFailed'));
    }
  };
  
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error(t('billing.errors.invalidAmount'));
      return;
    }
    
    if (amount > balance.available) {
      toast.error(t('billing.errors.insufficientBalance'));
      return;
    }
    
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const result = await StripeService.createPayout(user.uid, amount);
      if (result.success) {
        toast.success(t('billing.success.withdrawInitiated', { amount }));
        onWithdrawClose();
        setWithdrawAmount('');
        fetchBalance();
        fetchBillingData();
      } else {
        toast.error(t('billing.errors.withdrawFailed'));
      }
    } catch (error) {
      toast.error(t('billing.errors.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
      case 'escrow':
        return <Icon icon="lucide:arrow-down-circle" className="text-green-500" />;
      case 'withdrawal':
      case 'release':
        return <Icon icon="lucide:arrow-up-circle" className="text-red-500" />;
      case 'subscription':
        return <Icon icon="lucide:repeat" className="text-blue-500" />;
      case 'refund':
        return <Icon icon="lucide:rotate-ccw" className="text-yellow-500" />;
      default:
        return <Icon icon="lucide:circle" className="text-gray-500" />;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };
  
  // Calculate total earnings from transactions
  const totalEarnings = transactions
    .filter(t => (t.type === 'payment' || t.type === 'escrow') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Don't render anything if not a freelancer
  if (!userData || userData.userType === 'client') {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-mesh">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('billing.title')}</h1>
            <p className="text-gray-400">{t('billing.subtitle')}</p>
          </div>
        </div>
        
        <Tabs 
            aria-label="Billing options" 
            className="mb-8"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            classNames={{
              tabList: "flex-wrap md:flex-nowrap overflow-x-auto scrollbar-hide",
              tab: "min-w-fit"
            }}
          >
          <Tab key="earnings" title={t('billing.tabs.earnings')}>
            <div className="space-y-6">
              {/* Balance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="glass-effect border-none">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon icon="lucide:wallet" className="text-green-400" width={32} />
                    </div>
                    <h3 className="text-gray-400 text-sm">{t('billing.availableBalance')}</h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(balance.available)}</p>
                  </CardBody>
                </Card>
                
                <Card className="glass-effect border-none">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon icon="lucide:clock" className="text-yellow-400" width={32} />
                    </div>
                    <h3 className="text-gray-400 text-sm">{t('billing.pendingBalance')}</h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(balance.pending)}</p>
                  </CardBody>
                </Card>
                
                <Card className="glass-effect border-none">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon icon="lucide:trending-up" className="text-blue-400" width={32} />
                    </div>
                    <h3 className="text-gray-400 text-sm">{t('billing.totalEarnings')}</h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(totalEarnings)}</p>
                  </CardBody>
                </Card>
              </div>
              
              {/* Stripe Connect Setup */}
              {!connectStatus.isComplete && (
                <StripeConnectOnboarding onComplete={() => {
                  checkConnectStatus();
                  fetchBalance();
                }} />
              )}
              
              {/* Withdraw Funds */}
              {connectStatus.isComplete && balance.available > 0 && (
                <Card className="glass-effect border-none">
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-white">{t('billing.withdrawFunds')}</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-sm text-gray-400 mb-1 block">
                          {t('billing.amountToWithdraw')}
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          startContent={<span className="text-gray-400">€</span>}
                          max={balance.available}
                        />
                      </div>
                      <Button
                        color="primary"
                        onPress={onWithdrawOpen}
                        isDisabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                      >
                        {t('billing.withdraw')}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('billing.withdrawalTime')}
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>
          
          <Tab key="subscription" title={t('billing.tabs.proSubscription')}>
            <ProSubscription />
          </Tab>
          
          <Tab key="transactions" title={t('billing.tabs.transactions')}>
            <Card className="glass-effect border-none">
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">{t('billing.transactionHistory')}</h2>
              </CardHeader>
              <CardBody>
                {transactions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">{t('billing.noTransactions')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table
                      aria-label="Transaction history"
                      classNames={{
                        th: "bg-transparent text-gray-400",
                        td: "text-gray-300"
                      }}
                    >
                      <TableHeader>
                        <TableColumn>{t('billing.table.type')}</TableColumn>
                        <TableColumn>{t('billing.table.description')}</TableColumn>
                        <TableColumn>{t('billing.table.amount')}</TableColumn>
                        <TableColumn>{t('billing.table.status')}</TableColumn>
                        <TableColumn>{t('billing.table.date')}</TableColumn>
                        <TableColumn>{t('billing.table.action')}</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{getTransactionIcon(transaction.type)}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              <span className={
                                transaction.type === 'payment' || transaction.type === 'escrow' 
                                  ? 'text-green-500' 
                                  : 'text-red-500'
                              }>
                                {transaction.type === 'payment' || transaction.type === 'escrow' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="sm"
                                variant="flat"
                                color={
                                  transaction.status === 'completed' ? 'success' :
                                  transaction.status === 'pending' ? 'warning' :
                                  'danger'
                                }
                              >
                                {t(`billing.status.${transaction.status}`)}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {transaction.createdAt?.toDate ? 
                                  new Date(transaction.createdAt.toDate()).toLocaleDateString() : 
                                  t('common.recently')}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                              >
                                <Icon icon="lucide:download" className="text-gray-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
        
        <Modal isOpen={isWithdrawOpen} onClose={onWithdrawClose}>
          <ModalContent>
            <ModalHeader>{t('billing.confirmWithdrawal')}</ModalHeader>
            <ModalBody>
              <p className="text-gray-400 mb-4">
                {t('billing.withdrawalConfirmText', { amount: formatCurrency(parseFloat(withdrawAmount || '0')) })}
              </p>
              <p className="text-sm text-gray-400">
                {t('billing.withdrawalTimeInfo')}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onWithdrawClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                color="primary" 
                onPress={handleWithdraw}
                isLoading={loading}
              >
                {t('billing.confirmWithdrawalButton')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};

export default BillingPage;