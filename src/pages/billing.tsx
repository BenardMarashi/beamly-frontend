import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
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
    
    try {
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
      
      if (userData?.userType === 'freelancer' || userData?.userType === 'both') {
        const earnings = transactionsData
          .filter(t => t.type === 'payment' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = transactionsData
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        setBalance(earnings - withdrawals);
      }
      
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
            <p className="text-gray-400">Manage your payments and transactions</p>
          </div>
          {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
            <Button
              color="primary"
              onPress={onWithdrawOpen}
              startContent={<Icon icon="lucide:banknote" />}
            >
              Withdraw Funds
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:wallet" className="text-green-400" width={32} />
              </div>
              <h3 className="text-gray-400 text-sm">Available Balance</h3>
              <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:credit-card" className="text-blue-400" width={32} />
              </div>
              <h3 className="text-gray-400 text-sm">Payment Methods</h3>
              <p className="text-3xl font-bold text-white">{paymentMethods.length}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:activity" className="text-purple-400" width={32} />
              </div>
              <h3 className="text-gray-400 text-sm">Transactions</h3>
              <p className="text-3xl font-bold text-white">{transactions.length}</p>
            </CardBody>
          </Card>
        </div>
        
        <Card className="glass-effect border-none mb-8">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={onAddPaymentOpen}
            >
              Add New
            </Button>
          </CardHeader>
          <CardBody>
            {paymentMethods.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No payment methods added</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-4">
                      <Icon 
                        icon={method.type === 'card' ? 'lucide:credit-card' : 'lucide:building-2'} 
                        className="text-2xl text-gray-400"
                      />
                      <div>
                        <p className="text-white font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <p className="text-sm text-gray-400">Default</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="light" color="danger">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        
        <Card className="glass-effect border-none">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Transaction History</h2>
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