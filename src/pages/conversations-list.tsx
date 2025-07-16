import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Avatar, Badge, Spinner, Input, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithUser[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadConversations = async () => {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const conversationsData: ConversationWithUser[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            // Get other user's details
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              const otherUserData = userDoc.data();
              conversationsData.push({
                id: docSnapshot.id,
                lastMessage: data.lastMessage || '',
                lastMessageTime: data.lastMessageTime,
                unreadCount: data.participantDetails?.[user.uid]?.unreadCount || 0,
                otherUser: {
                  id: otherUserId,
                  displayName: otherUserData.displayName || 'Unknown User',
                  photoURL: otherUserData.photoURL || '',
                  userType: otherUserData.userType || 'user',
                  isOnline: otherUserData.isOnline
                }
              });
            }
          }
        }

        setConversations(conversationsData);
        setFilteredConversations(conversationsData);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    loadConversations();
  }, [user, navigate]);

  // Filter conversations based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.otherUser.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          {getTotalUnreadCount() > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {getTotalUnreadCount()} unread message{getTotalUnreadCount() > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="solar:pen-new-square-bold" />}
          onClick={() => navigate('/browse-freelancers')}
        >
          New Message
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Icon icon="solar:magnifer-line-duotone" className="text-default-400" />}
          isClearable
          onClear={() => setSearchTerm('')}
        />
      </div>

      {filteredConversations.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Icon 
              icon={searchTerm ? "solar:magnifer-broken" : "solar:chat-line-broken"} 
              className="text-6xl text-gray-400 mx-auto mb-4" 
            />
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No conversations found for "${searchTerm}"`
                : "No conversations yet"
              }
            </p>
            {!searchTerm && (
              <p className="text-sm text-gray-500">
                Start a conversation by messaging a freelancer or client
              </p>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              isPressable
              onClick={() => navigate(`/messages/${conversation.id}`)}
              className={`hover:shadow-md transition-all ${
                conversation.unreadCount > 0 ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <CardBody className="flex flex-row items-center gap-4 p-4">
                <Badge
                  content={conversation.unreadCount}
                  isInvisible={conversation.unreadCount === 0}
                  color="danger"
                  size="sm"
                >
                  <Badge
                    content=""
                    color="success"
                    placement="bottom-right"
                    isInvisible={!conversation.otherUser.isOnline}
                    classNames={{
                      badge: "w-3 h-3 border-2 border-white"
                    }}
                  >
                    <Avatar
                      src={conversation.otherUser.photoURL}
                      name={conversation.otherUser.displayName}
                      size="md"
                    />
                  </Badge>
                </Badge>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${
                      conversation.unreadCount > 0 ? 'text-primary' : ''
                    }`}>
                      {conversation.otherUser.displayName}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate flex-1 ${
                      conversation.unreadCount > 0 
                        ? 'font-semibold text-default-700' 
                        : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    <span className="text-xs text-gray-500 ml-2">
                      {conversation.otherUser.userType === 'freelancer' ? 'Freelancer' : 'Client'}
                    </span>
                  </div>
                </div>

                <Icon 
                  icon="solar:arrow-right-line-duotone" 
                  className="text-xl text-gray-400 flex-shrink-0"
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};