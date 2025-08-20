// src/components/payments/JobPayment.tsx
import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeService } from '../../services/stripe-service';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface JobPaymentProps {
  jobId: string;
  proposalId: string;
  freelancerName: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<JobPaymentProps> = ({
  jobId,
  proposalId,
  freelancerName,
  amount,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const result = await StripeService.createJobPayment(jobId, proposalId, amount);
      
      if (!result.success || !result.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        // Update payment status
        await StripeService.confirmJobPayment(result.paymentIntentId!);
        toast.success('Payment successful! Funds are held in escrow.');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-md">
        <CardHeader className="flex gap-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon icon="lucide:shield-check" className="text-2xl text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Secure Payment</p>
            <p className="text-sm text-gray-500">Funds held in escrow until work is complete</p>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Freelancer:</span>
              <span className="font-medium">{freelancerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Amount:</span>
              <span className="font-medium text-lg">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee (5%):</span>
              <span className="font-medium">${(amount * 0.05).toFixed(2)}</span>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold">Total:</span>
              <span className="font-bold text-xl">${(amount * 1.05).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex gap-2">
              <Icon icon="lucide:info" className="text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Escrow Protection</p>
                <p>Your payment will be held securely until you approve the completed work.</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-2">
            <Button
              variant="light"
              onPress={onCancel}
              isDisabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              isDisabled={!stripe || loading}
              className="flex-1"
            >
              Pay €{(amount * 1.05).toFixed(2)}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Powered by Stripe • Your payment info is secure and encrypted
          </p>
        </CardBody>
      </Card>
    </form>
  );
};

export const JobPayment: React.FC<JobPaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

// Component for releasing payment after job completion
export const ReleasePayment: React.FC<{
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  amount: number;
  onSuccess: () => void;
}> = ({ jobId, freelancerId, freelancerName, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    if (!window.confirm(`Are you sure you want to release €${amount} to ${freelancerName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await StripeService.releasePaymentToFreelancer(jobId, freelancerId);
      
      if (result.success) {
        toast.success('Payment released successfully!');
        onSuccess();
      } else {
        toast.error('Failed to release payment');
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h3 className="text-lg font-semibold">Release Payment</h3>
      </CardHeader>
      <CardBody className="gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <div className="flex gap-2">
            <Icon icon="lucide:alert-triangle" className="text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">Confirm Work Completion</p>
              <p>Once released, this payment cannot be reversed. Make sure you're satisfied with the work.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Freelancer:</span>
            <span className="font-medium">{freelancerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount to Release:</span>
            <span className="font-medium text-lg">${amount.toFixed(2)}</span>
          </div>
        </div>

        <Button
          color="success"
          size="lg"
          className="w-full"
          onPress={handleRelease}
          isLoading={loading}
          startContent={!loading && <Icon icon="lucide:check-circle" />}
        >
          Release Payment
        </Button>
      </CardBody>
    </Card>
  );
};