// src/pages/conversations-list.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Card, CardBody, Avatar, Chip, Spinner, Input, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ConversationService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { MessagesView } from '../components/MessagesView'; // We'll create this

interface ConversationWithUser {
  id: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  otherUser: {
    id: string;
    displayName: string;
    photoURL: string;
    userType: string;
    isOnline?: boolean;
  };
}

export const ConversationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { conversationId } = useParams(); // For desktop view
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversationId || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [processedConversationIds, setProcessedConversationIds] = useState<Set<string>>(new Set());

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle URL parameter for starting new conversation
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && user && !creatingConversation) {
      handleStartConversation(userId);
    }
  }, [searchParams, user]);

  // Update selected conversation when URL changes
  useEffect(() => {
    if (conversationId && !isMobile) {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId, isMobile]);

  const handleStartConversation = async (otherUserId: string) => {
    if (!user || !userData || creatingConversation) return;
    
    setCreatingConversation(true);
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        conv => conv.otherUser.id === otherUserId
      );
      
      if (existingConversation) {
        handleConversationClick(existingConversation.id);
        // Clear the URL parameter to prevent re-triggering
        navigate(location.pathname, { replace: true });
        return;
      }
      
      const result = await ConversationService.findOrCreateConversation(
        user.uid,
        otherUserId
      );
      
      if (result.success && result.conversationId) {
        handleConversationClick(result.conversationId);
        if (result.isNew) {
          toast.success('Conversation started!');
        }
        // Clear the URL parameter to prevent re-triggering
        navigate(location.pathname, { replace: true });
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    if (isMobile) {
      // On mobile, navigate to separate page
      navigate(`/messages/${conversationId}`);
    } else {
      // On desktop, update URL and show in split view
      setSelectedConversationId(conversationId);
      navigate(`/messages/${conversationId}`, { replace: true });
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: ConversationWithUser[] = [];
      const seenParticipants = new Set<string>();

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);
        
        // Skip if we've already processed a conversation with this user
        if (otherUserId && !seenParticipants.has(otherUserId)) {
          seenParticipants.add(otherUserId);
          
          // Always fetch fresh user data from users collection
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          let otherUserData = null;
          
          if (userDoc.exists()) {
            const freshUserData = userDoc.data();
            otherUserData = {
              displayName: freshUserData.displayName || freshUserData.name || 'User',
              photoURL: freshUserData.photoURL || freshUserData.photo,
              userType: freshUserData.userType,
              isOnline: freshUserData.isOnline
            };
          }
          
          if (otherUserData) {
            conversationsData.push({
              id: docSnapshot.id,
              lastMessage: data.lastMessage || 'No messages yet',
              lastMessageTime: data.lastMessageTime,
              unreadCount: data.participantDetails?.[user.uid]?.unreadCount || 0,
              otherUser: {
                id: otherUserId,
                displayName: otherUserData.displayName || 'Unknown User',
                photoURL: otherUserData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserData.displayName || 'User')}&background=FCE90D&color=011241`,
                userType: otherUserData.userType || 'freelancer',
                isOnline: otherUserData.isOnline || false
              }
            });
          }
        }
      }

      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading || creatingConversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-400 mt-4">
            {creatingConversation ? 'Starting conversation...' : 'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

const conversationsList = (
  <div className="h-full flex flex-col">
    <div className="p-4 pb-14">
      <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
      <p className="text-gray-400 text-sm mb-3">Your conversations with freelancers and clients</p>
      <Input
        placeholder="Search conversations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        startContent={<Icon icon="lucide:search" className="text-gray-400" />}
        classNames={{
          input: "text-white",
          inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
        }}
      />
    </div>

      <div className="border-t border-white/10 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Icon icon="lucide:message-circle" className="text-6xl text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
            <p className="text-gray-400 mb-6">Start a conversation by messaging a freelancer</p>
            <Button
              color="secondary"
              onPress={() => navigate('/browse-freelancers')}
              startContent={<Icon icon="lucide:search" />}
            >
              Browse Freelancers
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id && !isMobile
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={conversation.otherUser.photoURL}
                      name={conversation.otherUser.displayName}
                      className="w-12 h-12"
                    />
                    {conversation.unreadCount > 0 && (
                      <Chip 
                        color="danger" 
                        size="sm"
                        variant="solid"
                        className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1"
                      >
                        {conversation.unreadCount}
                      </Chip>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {conversation.otherUser.displayName}
                      </h3>
                      <span className="text-gray-400 text-xs">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Mobile layout - just the conversations list
  if (isMobile) {
    return (
      <div className="pt-20 h-screen flex flex-col bg-mesh">
        <Card className="glass-effect border-none h-full rounded-none">
          <CardBody className="p-0">
            {conversationsList}
          </CardBody>
        </Card>
      </div>
    );
  }

  // Desktop layout - split view
  return (
    <div className="pt-20 h-[calc(100vh-5rem)] flex gap-4 p-4">
      {/* Conversations List - Left Side */}
      <Card className="glass-effect border-none w-96 flex-shrink-0">
        <CardBody className="p-0">
          {conversationsList}
        </CardBody>
      </Card>

      {/* Messages View - Right Side */}
      <Card className="glass-effect border-none flex-1">
        <CardBody className="p-0">
          {selectedConversationId ? (
            <MessagesView 
              conversationId={selectedConversationId} 
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Icon icon="lucide:message-square" className="text-6xl text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-400">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};