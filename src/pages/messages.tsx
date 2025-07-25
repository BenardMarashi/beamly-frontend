// src/pages/messages.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Avatar, Spinner, Badge } from '@nextui-org/react';
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

  // Force full screen on mount
  useEffect(() => {
    // Hide the navbar on mobile
    const navbar = document.querySelector('header');
    if (navbar) {
      navbar.style.display = 'none';
    }
    
    // Remove any padding from root
    const root = document.getElementById('root');
    if (root) {
      root.style.padding = '0';
      root.style.margin = '0';
      root.style.maxWidth = '100vw';
      root.style.width = '100vw';
    }
    
    // Cleanup on unmount
    return () => {
      if (navbar) {
        navbar.style.display = '';
      }
      if (root) {
        root.style.padding = '';
        root.style.margin = '';
        root.style.maxWidth = '';
        root.style.width = '';
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation details
  useEffect(() => {
    if (!conversationId || !user) {
      console.log('Missing conversationId or user');
      return;
    }

    const loadConversation = async () => {
      try {
        console.log('Loading conversation:', conversationId);
        const result = await ConversationService.getConversationWithDetails(
          conversationId,
          user.uid
        );

        if (result.success && result.conversation) {
          console.log('Conversation loaded:', result.conversation);
          setConversation(result.conversation);
          if (result.otherUser) {
            setOtherUser(result.otherUser as OtherUser);
          }
          
          // Mark messages as read
          await ConversationService.markMessagesAsRead(conversationId, user.uid);
        } else {
          console.error('Conversation not found');
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
    if (!conversationId || !user) {
      console.log('Skipping message subscription - missing conversationId or user');
      return;
    }

    console.log('Setting up message subscription for conversation:', conversationId);

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log('Messages snapshot received, count:', snapshot.docs.length);
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        
        console.log('Messages:', newMessages);
        setMessages(newMessages);

        // Mark new messages as read if they're for us
        const unreadMessages = newMessages.filter(
          msg => msg.recipientId === user.uid && msg.status !== 'read'
        );
        if (unreadMessages.length > 0) {
          ConversationService.markMessagesAsRead(conversationId, user.uid);
        }
      },
      (error) => {
        console.error('Error in message subscription:', error);
        toast.error('Failed to load messages');
      }
    );

    return () => {
      console.log('Cleaning up message subscription');
      unsubscribe();
    };
  }, [conversationId, user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!newMessage.trim() || !otherUser || !conversationId) {
      console.log('Cannot send message - missing data');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    setSending(true);
    try {
      console.log('Sending message:', messageText);
      const result = await ConversationService.sendMessage({
        conversationId,
        senderId: user!.uid,
        senderName: userData?.displayName || 'User',
        recipientId: otherUser.id,
        text: messageText
      });

      if (result.success) {
        console.log('Message sent successfully');
        messageInputRef.current?.focus();
      } else {
        console.error('Failed to send message:', result.error);
        toast.error('Failed to send message');
        setNewMessage(messageText); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#010b29]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#010b29]">
        <div className="text-center p-4">
          <Icon icon="lucide:message-circle-x" className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Conversation not found</p>
          <Button 
            onPress={() => navigate('/messages')}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#010b29] flex flex-col">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 border-b border-white/10 flex items-center gap-4 bg-[#010b29]">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate('/messages')}
          className="text-white"
        >
          <Icon icon="lucide:arrow-left" className="text-xl" />
        </Button>
        
        <Badge
          content=""
          color="success"
          placement="bottom-right"
          isInvisible={!otherUser.isOnline}
          classNames={{
            badge: "w-3 h-3 border-2 border-[#010b29]"
          }}
        >
          <Avatar
            src={otherUser.photoURL || `https://ui-avatars.com/api/?name=${otherUser.displayName}&background=FCE90D&color=011241`}
            name={otherUser.displayName}
            className="cursor-pointer"
            onClick={() => navigate(`/freelancer/${otherUser.id}`)}
          />
        </Badge>
        
        <div className="flex-1">
          <h3 className="font-semibold text-white">{otherUser.displayName}</h3>
          <p className="text-sm text-gray-400 capitalize">
            {otherUser.userType === 'freelancer' ? 'Freelancer' : 
             otherUser.userType === 'client' ? 'Client' : 'User'}
            {otherUser.isOnline && ' • Online'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Icon icon="lucide:message-circle" className="text-6xl text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?.uid;
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showTime = !previousMessage || 
                formatMessageTime(previousMessage.createdAt) !== formatMessageTime(message.createdAt);
              
              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-white/10 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="break-words text-sm">{message.text}</p>
                      {isOwn && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Icon 
                            icon={message.status === 'read' ? "lucide:check-check" : "lucide:check"} 
                            className={`text-xs ${message.status === 'read' ? 'text-white' : 'text-white/60'}`}
                          />
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
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#010b29]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            classNames={{
              input: "text-white",
              inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
            }}
          />
          <Button
            type="submit"
            isIconOnly
            isLoading={sending}
            disabled={!newMessage.trim() || sending}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Icon icon="lucide:send" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MessagesPage;