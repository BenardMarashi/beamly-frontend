# Notification Click Routing System - Implementation Guide

## **Current System Analysis**

### **Notification Flow:**
1. **Notification Creation** → Stored in Firestore with `actionUrl`
2. **Real-time Display** → Toast notifications appear via NotificationContext
3. **Current Issue** → Toasts are NOT clickable, users can't navigate to relevant pages

### **Notification Types & Data Structure:**
```typescript
interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'new-job' | 'proposal' | 'message' | 'payment' | 'review' | 'system';
  read: boolean;
  createdAt: any;
  actionUrl?: string;  // ← KEY FIELD for routing
}
```

### **Current Notification Creation Examples:**
- **Proposals**: `actionUrl: "/job/${jobId}/proposals"`
- **Reviews**: `actionUrl: "/reviews/${reviewId}"`
- **Payments**: `actionUrl: "/payments/${paymentId}"`
- **Messages**: `actionUrl: "/messages/${conversationId}"`

## **Implementation Strategy**

### **1. Make Toast Notifications Clickable**

**File:** `/home/benard/src/beamly-frontend/src/contexts/NotificationContext.tsx`

**Lines 54-62:** Replace the toast notification logic:
```typescript
        // Show toast for new notifications
        if (newNotifications.length > notifications.length) {
          const newest = newNotifications[0];
          toast(newest.title, {
            icon: '🔔',
            duration: 5000,
          });
        }
```

**With:**
```typescript
        // Show clickable toast for new notifications
        if (newNotifications.length > notifications.length) {
          const newest = newNotifications[0];
          
          // Create clickable custom toast
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white/10 backdrop-blur-lg shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-white/20 transition-colors`}
              onClick={() => {
                toast.dismiss(t.id);
                handleNotificationClick(newest);
              }}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon 
                      icon={getNotificationIcon(newest.type)} 
                      className="h-6 w-6 text-blue-400" 
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-white">
                      {newest.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      {newest.body}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Click to view
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200/20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-300 focus:outline-none"
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'top-right',
          });
        }
```

### **2. Add Notification Routing Handler**

**File:** `/home/benard/src/beamly-frontend/src/contexts/NotificationContext.tsx`

**Add these imports at the top:**
```typescript
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
```

**Add inside the NotificationProvider component:**
```typescript
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ADD THIS FUNCTION
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read first
      await markAsRead(notification.id);
      
      // Route to appropriate page
      const route = getNotificationRoute(notification);
      if (route) {
        navigate(route);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // ADD THIS FUNCTION
  const getNotificationRoute = (notification: Notification): string | null => {
    // Use actionUrl if provided
    if (notification.actionUrl) {
      return notification.actionUrl;
    }

    // Fallback routing based on notification type
    switch (notification.type) {
      case 'message':
        // Extract conversation ID from metadata or route to messages
        return '/messages';
      
      case 'proposal':
        // Check if it's about receiving or sending proposals
        if (notification.body.includes('submitted a proposal')) {
          // For clients receiving proposals - extract job ID if possible
          const jobIdMatch = notification.body.match(/for "(.+?)"/);
          return jobIdMatch ? '/client/proposals' : '/proposals';
        } else {
          // For freelancers - go to their proposals
          return '/freelancer/proposals';
        }
      
      case 'payment':
        return '/billing';
      
      case 'review':
        return '/profile'; // Or specific review page
      
      case 'new-job':
        return '/browse-jobs';
      
      case 'system':
        return '/notifications';
      
      default:
        return '/notifications';
    }
  };

  // ADD THIS FUNCTION
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'message':
        return 'lucide:message-square';
      case 'proposal':
        return 'lucide:file-text';
      case 'payment':
        return 'lucide:euro';
      case 'review':
        return 'lucide:star';
      case 'new-job':
        return 'lucide:briefcase';
      case 'system':
        return 'lucide:settings';
      default:
        return 'lucide:bell';
    }
  };
```

### **3. Enhanced NotificationService for Better ActionURLs**

**File:** `/home/benard/src/beamly-frontend/src/services/firebase-services.ts`

**Find the sendMessage function and add notification creation:**
```typescript
      // Create notification for recipient (AFTER line 712)
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        type: 'message',
        title: 'New Message',
        body: `${senderName} sent you a message`,
        data: {
          conversationId,
          senderId,
          senderName
        },
        read: false,
        actionUrl: `/messages/${conversationId}`,  // ← SPECIFIC CONVERSATION
        createdAt: serverTimestamp()
      });
```

**Update other notification creations to include specific actionUrls:**

**For Proposals (line ~650):**
```typescript
          await NotificationService.createNotification({
            userId: proposalData.clientId,
            title: 'New Proposal',
            body: `${proposalData.freelancerName} submitted a proposal for "${proposalData.jobTitle}"`,
            type: 'proposal',
            relatedId: proposalRef.id,
            actionUrl: `/client/proposals?job=${proposalData.jobId}&proposal=${proposalRef.id}`
          });
```

**For Reviews:**
```typescript
        await NotificationService.createNotification({
          userId: reviewData.revieweeId,
          title: 'New Review',
          body: `${reviewData.reviewerName} left you a ${reviewData.rating}-star review`,
          type: 'review',
          relatedId: reviewRef.id,
          actionUrl: `/profile?tab=reviews&review=${reviewRef.id}`
        });
```

**For Payments:**
```typescript
        await NotificationService.createNotification({
          userId: paymentData.recipientId,
          title: 'New Payment',
          body: `You received a payment of ${paymentData.currency} ${paymentData.amount} from ${paymentData.senderName}`,
          type: 'payment',
          relatedId: paymentRef.id,
          priority: 'high',
          actionUrl: `/billing?transaction=${paymentRef.id}`
        });
```

### **4. Add Notification Badge to Navigation**

**File:** `/home/benard/src/beamly-frontend/src/components/hamburger-menu.tsx`

**Find the notification menu item and update:**
```typescript
      { 
        name: t('nav.notifications'), 
        path: "/notifications", 
        icon: "lucide:bell",
        badge: unreadCount > 0 ? unreadCount : undefined  // ADD BADGE
      },
```

**Add unreadCount import:**
```typescript
import { useNotifications } from '../contexts/NotificationContext';

// Inside component:
const { unreadCount } = useNotifications();
```

### **5. Enhanced Navigation Bar with Notification Bell**

**Create:** `/home/benard/src/beamly-frontend/src/components/navigation/NotificationBell.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Badge, Popover, PopoverTrigger, PopoverContent, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button isIconOnly variant="light" className="relative">
          <Icon icon="lucide:bell" width={20} />
          {unreadCount > 0 && (
            <Badge
              content={unreadCount > 99 ? '99+' : unreadCount}
              color="danger"
              className="absolute -top-1 -right-1"
              size="sm"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Card className="border-none shadow-lg">
          <CardBody className="p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence>
                {recentNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Icon icon="lucide:bell-off" className="mx-auto mb-2" width={32} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          !notification.read ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Icon
                            icon={getNotificationIcon(notification.type)}
                            width={16}
                            className={!notification.read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.createdAt?.toDate ? 
                              new Date(notification.createdAt.toDate()).toLocaleDateString() : 
                              'Recently'}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardBody>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'message': return 'lucide:message-square';
    case 'proposal': return 'lucide:file-text';
    case 'payment': return 'lucide:euro';
    case 'review': return 'lucide:star';
    case 'new-job': return 'lucide:briefcase';
    case 'system': return 'lucide:settings';
    default: return 'lucide:bell';
  }
};
```

### **6. Add NotificationBell to Main Navigation**

**File:** `/home/benard/src/beamly-frontend/src/pages/home.tsx`

**Replace the current notification button (around line 123):**
```typescript
              <Button 
                isIconOnly 
                variant="light" 
                className={isDarkMode ? "text-white" : "text-gray-800"}
                onPress={() => navigate('/notifications')}
              >
                <Icon icon="lucide:bell" width={24} />
              </Button>
```

**With:**
```typescript
              <NotificationBell />
```

**Add import:**
```typescript
import { NotificationBell } from '../components/navigation/NotificationBell';
```

### **7. Notification Type Mapping Reference**

| Notification Type | Target Page | ActionUrl Format |
|------------------|-------------|------------------|
| `message` | `/messages/${conversationId}` | Direct to specific conversation |
| `proposal` (received) | `/client/proposals?job=${jobId}` | Client's proposals page filtered |
| `proposal` (status) | `/freelancer/proposals` | Freelancer's proposals |
| `payment` | `/billing?transaction=${paymentId}` | Billing page with transaction |
| `review` | `/profile?tab=reviews` | Profile reviews tab |
| `new-job` | `/browse-jobs?category=${category}` | Jobs matching criteria |
| `system` | `/notifications` | Notifications page |

### **8. Enhanced Message Notifications**

**File:** `/home/benard/src/beamly-frontend/src/services/firebase-services.ts`

**In the sendMessage function, replace the notification creation:**
```typescript
      // Create notification for recipient
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        type: 'message',
        title: 'New Message',
        body: `${senderName} sent you a message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        data: {
          conversationId,
          senderId,
          senderName,
          messagePreview: text.substring(0, 100)
        },
        read: false,
        actionUrl: `/messages/${conversationId}`,
        priority: 'high',
        createdAt: serverTimestamp()
      });
```

## **Implementation Timeline**

### **Phase 1: Core Functionality (High Priority)**
1. ✅ Make toast notifications clickable
2. ✅ Add notification routing handler
3. ✅ Update notification service with better actionUrls

### **Phase 2: Enhanced UX (Medium Priority)**
1. ✅ Add notification bell to navigation
2. ✅ Create notification popover component
3. ✅ Add badges to navigation items

### **Phase 3: Advanced Features (Low Priority)**
1. Add notification preferences
2. Add notification sound effects
3. Add push notification support

## **Testing Checklist**

After implementation, test:

1. ✅ **Message Notifications** → Click should go to specific conversation
2. ✅ **Proposal Notifications** → Click should go to proposals page with filters
3. ✅ **Payment Notifications** → Click should go to billing with transaction highlighted
4. ✅ **Review Notifications** → Click should go to profile reviews
5. ✅ **Job Notifications** → Click should go to browse jobs
6. ✅ **System Notifications** → Click should go to notifications page
7. ✅ **Notification Bell Badge** → Shows unread count correctly
8. ✅ **Mark as Read** → Notifications marked as read when clicked
9. ✅ **Toast Dismissal** → Can dismiss notifications without clicking
10. ✅ **Mobile Responsiveness** → Works on mobile devices

## **Benefits**

- ✅ **Better UX**: Users can quickly navigate to relevant content
- ✅ **Increased Engagement**: Direct access to important updates
- ✅ **Reduced Friction**: No need to hunt for notification sources
- ✅ **Modern Experience**: Clickable notifications are expected UX
- ✅ **Accessibility**: Clear visual and interaction feedback

This implementation provides a complete notification routing system that makes all notifications clickable and routes users to the most relevant page for each notification type.