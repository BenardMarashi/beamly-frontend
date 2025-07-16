import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Input, Avatar, Spinner, Badge } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { ConversationService } from '../services/firebase-services';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  attachments?: string[];
  status: 'sent' | 'delivered' | 'read';
  createdAt: any;
  readAt?: any;
}

interface OtherUser {
  id: string;
  displayName: string;
  photoURL: string;
  userType: string;
  isOnline?: boolean;
}

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation details
  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      try {
        const result = await ConversationService.getConversationWithDetails(
          conversationId,
          user.uid
        );

        if (result.success && result.conversation) {
          setConversation(result.conversation);
          if (result.otherUser) {
            setOtherUser(result.otherUser as OtherUser);
          }
          
          // Mark messages as read
          await ConversationService.markMessagesAsRead(conversationId, user.uid);
        } else {
          toast.error('Conversation not found');
          navigate('/messages');
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, user, navigate]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);

      // Mark new messages as read if they're for us
      const unreadMessages = newMessages.filter(
        msg => msg.recipientId === user.uid && msg.status !== 'read'
      );
      if (unreadMessages.length > 0) {
        ConversationService.markMessagesAsRead(conversationId, user.uid);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !otherUser || !conversationId) return;

    setSending(true);
    try {
      const result = await ConversationService.sendMessage({
        conversationId,
        senderId: user!.uid,
        senderName: userData?.displayName || 'User',
        recipientId: otherUser.id,
        text: newMessage.trim()
      });

      if (result.success) {
        setNewMessage('');
        messageInputRef.current?.focus();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const messageDate = new Date(date);
    
    // If today, show time only
    if (messageDate.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    // If yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody className="text-center py-12">
            <Icon icon="solar:chat-line-broken" className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No conversation found</p>
            <Button onClick={() => navigate('/messages')} color="primary">
              Back to Messages
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onClick={() => navigate('/messages')}
          >
            <Icon icon="solar:arrow-left-line-duotone" className="text-xl" />
          </Button>
          <Badge
            content=""
            color="success"
            placement="bottom-right"
            isInvisible={!otherUser.isOnline}
            classNames={{
              badge: "w-3 h-3 border-2 border-white"
            }}
          >
            <Avatar
              src={otherUser.photoURL}
              name={otherUser.displayName}
              size="sm"
              className="cursor-pointer"
              onClick={() => navigate(`/freelancer/${otherUser.id}`)}
            />
          </Badge>
          <div className="flex-1">
            <h3 className="font-semibold">{otherUser.displayName}</h3>
            <p className="text-sm text-gray-500">
              {otherUser.userType === 'freelancer' ? 'Freelancer' : 'Client'}
              {otherUser.isOnline && ' • Online'}
            </p>
          </div>
          <Button
            isIconOnly
            variant="light"
          >
            <Icon icon="solar:menu-dots-bold" className="text-xl" />
          </Button>
        </div>

        {/* Messages */}
        <CardBody className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:chat-dots-broken" className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.senderId === user?.uid;
                const showTime = index === 0 || 
                  (messages[index - 1] && 
                   formatMessageTime(messages[index - 1].createdAt) !== formatMessageTime(message.createdAt));
                
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center my-4">
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="break-words">{message.text}</p>
                        {message.status === 'read' && isOwn && (
                          <div className="flex items-center gap-1 mt-1">
                            <Icon icon="solar:check-read-linear" className="text-xs opacity-70" />
                            <span className="text-xs opacity-70">Read</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardBody>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="light"
              size="lg"
            >
              <Icon icon="solar:paperclip-bold" className="text-xl" />
            </Button>
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={sending}
              classNames={{
                input: "text-base",
                inputWrapper: "h-12"
              }}
            />
            <Button
              isIconOnly
              color="primary"
              size="lg"
              isDisabled={!newMessage.trim() || sending}
              onClick={handleSendMessage}
              isLoading={sending}
            >
              <Icon icon="solar:send-square-bold" className="text-xl" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};