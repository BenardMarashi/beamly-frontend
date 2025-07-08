import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'refund' | 'subscription';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: any;
  jobId?: string;
  jobTitle?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4: string;
  brand?: string;
  isDefault: boolean;
}

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isAddPaymentOpen, onOpen: onAddPaymentOpen, onClose: onAddPaymentClose } = useDisclosure();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchBillingData();
    }
  }, [user, navigate]);
  
  const fetchBillingData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where(userData?.userType === 'client' ? 'clientId' : 'freelancerId', '==', user.uid),
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
      
      // Calculate balance (for freelancers)
      if (userData?.userType === 'freelancer' || userData?.userType === 'both') {
        const earnings = transactionsData
          .filter(t => t.type === 'payment' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = transactionsData
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        setBalance(earnings - withdrawals);
      }
      
      // Mock payment methods (in real app, would fetch from Stripe or payment provider)
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true
        }
      ]);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    // In a real app, this would process the withdrawal
    toast.success('Withdrawal request submitted');
    onWithdrawClose();
    setWithdrawAmount('');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return 'lucide:arrow-down-circle';
      case 'withdrawal':
        return 'lucide:arrow-up-circle';
      case 'refund':
        return 'lucide:rotate-ccw';
      case 'subscription':
        return 'lucide:credit-card';
      default:
        return 'lucide:circle';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading billing data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">Billing & Payments</h1>
        
        {/* Balance Card (for freelancers) */}
        {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Available Balance</h2>
                  <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm mt-1">Ready to withdraw</p>
                </div>
                <Button
                  color="primary"
                  startContent={<Icon icon="lucide:arrow-up-circle" />}
                  onClick={onWithdrawOpen}
                  isDisabled={balance <= 0}
                >
                  Withdraw Funds
                </Button>
              </div>
              <Progress 
                value={(balance / (userData?.totalEarnings || 1)) * 100} 
                color="success"
                className="mb-2"
              />
              <p className="text-gray-400 text-sm">
                Total earnings: ${userData?.totalEarnings?.toFixed(2) || '0.00'}
              </p>
            </CardBody>
          </Card>
        )}
        
        {/* Payment Methods */}
        <Card className="glass-effect border-none mb-6">
          <CardBody className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
              <Button
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:plus" />}
                onClick={onAddPaymentOpen}
              >
                Add Payment Method
              </Button>
            </div>
            
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="lucide:credit-card" className="text-gray-400 mb-4 mx-auto" width={48} />
                <p className="text-gray-400">No payment methods added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        icon={method.type === 'card' ? 'lucide:credit-card' : 
                              method.type === 'bank' ? 'lucide:building' : 
                              'lucide:wallet'}
                        className="text-gray-400"
                        width={24}
                      />
                      <div>
                        <p className="text-white">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <Chip size="sm" color="primary" variant="flat">Default</Chip>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        
        {/* Transaction History */}
        <Card className="glass-effect border-none">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="lucide:receipt" className="text-gray-400 mb-4 mx-auto" width={48} />
                <p className="text-gray-400">No transactions yet</p>
              </div>
            ) : (
              <Table aria-label="Transactions table" className="glass-effect">
                <TableHeader>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DESCRIPTION</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon 
                            icon={getTransactionIcon(transaction.type)}
                            className={transaction.type === 'payment' ? 'text-green-400' : 
                                      transaction.type === 'withdrawal' ? 'text-blue-400' : 
                                      'text-gray-400'}
                            width={20}
                          />
                          <span className="text-white capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{transaction.description}</p>
                          {transaction.jobTitle && (
                            <p className="text-gray-400 text-xs">Job: {transaction.jobTitle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={`font-medium ${
                          transaction.type === 'payment' ? 'text-green-400' : 
                          transaction.type === 'withdrawal' ? 'text-blue-400' : 
                          'text-white'
                        }`}>
                          {transaction.type === 'payment' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="sm" 
                          color={getStatusColor(transaction.status)}
                          variant="flat"
                        >
                          {transaction.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <p className="text-gray-400 text-sm">
                          {transaction.createdAt?.toDate ? 
                            new Date(transaction.createdAt.toDate()).toLocaleDateString() : 
                            'Recently'}
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
            )}
          </CardBody>
        </Card>
        
        {/* Withdraw Modal */}
        <Modal isOpen={isWithdrawOpen} onClose={onWithdrawClose}>
          <ModalContent>
            <ModalHeader>Withdraw Funds</ModalHeader>
            <ModalBody>
              <p className="text-gray-400 mb-4">
                Available balance: ${balance.toFixed(2)}
              </p>
              <Input
                type="number"
                label="Amount to withdraw"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                startContent={<span className="text-gray-400">$</span>}
              />
              <p className="text-sm text-gray-400 mt-2">
                Funds will be transferred to your default payment method within 3-5 business days.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onWithdrawClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleWithdraw}>
                Withdraw
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Add Payment Method Modal */}
        <Modal isOpen={isAddPaymentOpen} onClose={onAddPaymentClose}>
          <ModalContent>
            <ModalHeader>Add Payment Method</ModalHeader>
            <ModalBody>
              <p className="text-gray-400">
                Payment method integration would be implemented here with Stripe or another payment provider.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onAddPaymentClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};

export default BillingPage;