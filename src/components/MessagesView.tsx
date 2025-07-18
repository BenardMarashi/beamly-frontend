// src/components/MessagesView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Avatar, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { ConversationService } from '../services/firebase-services';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

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

interface MessagesViewProps {
  conversationId: string;
  onBack?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ conversationId, onBack }) => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          if (result.otherUser) {
            setOtherUser(result.otherUser);
          }
          
          // Mark messages as read
          await ConversationService.markMessagesAsRead(conversationId, user.uid);
        } else {
          toast.error('Conversation not found');
          if (isMobile) {
            navigate('/messages');
          } else if (onBack) {
            onBack();
          }
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, user, navigate, isMobile, onBack]);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    if (isMobile) {
      navigate('/messages');
    } else if (onBack) {
      onBack();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon icon="lucide:message-x" className="text-6xl text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Conversation not found
          </h3>
          <Button
            color="secondary"
            onPress={handleBack}
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-mesh">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          onPress={handleBack}
          className="text-white"
        >
          <Icon icon="lucide:arrow-left" className="text-xl" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={otherUser.photoURL}
            name={otherUser.displayName}
            className="w-10 h-10"
          />
          <div>
            <h3 className="font-semibold text-white">{otherUser.displayName}</h3>
            <p className="text-xs text-gray-400 capitalize">{otherUser.userType}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:message-circle" className="text-6xl text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === user!.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-white/10 text-white ml-12'
                      : 'bg-white/10 text-white mr-12'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                  <p className="text-xs mt-1 text-white/60">
                    {formatTime(message.createdAt)}
                    {isMe && message.status === 'read' && ' • Read'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            classNames={{
              input: "text-white",
              inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
            }}
          />
          <Button
            color="secondary"
            isIconOnly
            onPress={handleSendMessage}
            isLoading={sending}
            disabled={!newMessage.trim() || sending}
          >
            <Icon icon="lucide:send" />
          </Button>
        </div>
      </div>
    </div>
  );
};