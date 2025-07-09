import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4: string;
  brand?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'subscription' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: any;
}

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
        where(userData?.userType === 'freelancer' ? 'freelancerId' : 'clientId', '==', user.uid),
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
    
    // TODO: Implement withdrawal logic
    toast.success(`Withdrawal of $${amount} initiated`);
    onWithdrawClose();
    setWithdrawAmount('');
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Icon icon="lucide:arrow-down-circle" className="text-green-500" />;
      case 'withdrawal':
        return <Icon icon="lucide:arrow-up-circle" className="text-red-500" />;
      case 'subscription':
        return <Icon icon="lucide:repeat" className="text-blue-500" />;
      case 'refund':
        return <Icon icon="lucide:rotate-ccw" className="text-yellow-500" />;
      default:
        return <Icon icon="lucide:circle" className="text-gray-500" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl font-bold text-white mb-8">Billing & Payments</h1>
        
        {/* Balance Card (for freelancers) */}
        {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
          <Card className="glass-card mb-6">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 mb-1">Available Balance</p>
                  <h2 className="text-3xl font-bold text-white">${balance.toFixed(2)}</h2>
                </div>
                <Button
                  color="secondary"
                  onPress={onWithdrawOpen}
                  disabled={balance <= 0}
                >
                  Withdraw Funds
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* Payment Methods */}
        <Card className="glass-card mb-6">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
            <Button size="sm" color="secondary" onPress={onAddPaymentOpen}>
              Add New
            </Button>
          </CardHeader>
          <CardBody>
            {paymentMethods.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payment methods added</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex justify-between items-center p-4 glass-card">
                    <div className="flex items-center gap-3">
                      <Icon 
                        icon={
                          method.type === 'card' ? 'lucide:credit-card' :
                          method.type === 'bank' ? 'lucide:building' :
                          'lucide:wallet'
                        } 
                        className="text-2xl text-beamly-secondary"
                      />
                      <div>
                        <p className="text-white font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="text-xs text-gray-400">Default</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="light">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        
        {/* Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          </CardHeader>
          <CardBody>
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            ) : (
              <Table
                aria-label="Transaction history"
                classNames={{
                  th: "bg-transparent text-gray-400",
                  td: "text-gray-300"
                }}
              >
                <TableHeader>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>DESCRIPTION</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{getTransactionIcon(transaction.type)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span className={transaction.type === 'payment' ? 'text-green-500' : 'text-red-500'}>
                          {transaction.type === 'payment' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
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