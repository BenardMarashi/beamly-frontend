// src/components/MessagesView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
          if (result.otherUser) {
            setOtherUser(result.otherUser);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newMessage.trim() || !otherUser || !conversationId) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    setSending(true);
    try {
      const result = await ConversationService.sendMessage({
        conversationId,
        senderId: user!.uid,
        senderName: userData?.displayName || 'User',
        recipientId: otherUser.id,
        text: messageText
      });

      if (!result.success) {
        // Restore message if send failed
        setNewMessage(messageText);
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      // Refocus input after sending
      messageInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    navigate('/messages');
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
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

  if (!otherUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#010b29]">
        <div className="text-center">
          <Icon icon="lucide:message-x" className="text-6xl text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Conversation not found
          </h3>
          <Button
            onPress={handleBack}
            startContent={<Icon icon="lucide:arrow-left" />}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#010b29]">
      {/* Header - flex-shrink-0 to prevent compression */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center gap-3 bg-[#010b29]">
        <Button
          isIconOnly
          variant="light"
          onPress={handleBack}
          className="text-white"
        >
          <Icon icon="lucide:arrow-left" className="text-xl" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
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
                src={otherUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.displayName)}&background=FCE90D&color=011241`}
                name={otherUser.displayName}
                className={`w-10 h-10 ${otherUser.userType === 'freelancer' ? 'cursor-pointer' : ''}`}
                onClick={otherUser.userType === 'freelancer' ? () => navigate(`/freelancer/${otherUser.id}`) : undefined}
              />
          </Badge>
          <div>
            <h3 
              className={`font-semibold text-white ${otherUser.userType === 'freelancer' ? 'cursor-pointer hover:underline' : ''}`}
              onClick={otherUser.userType === 'freelancer' ? () => navigate(`/freelancer/${otherUser.id}`) : undefined}
            >
              {otherUser.displayName}
            </h3>
            <p className="text-xs text-gray-400 capitalize">
              {otherUser.userType}
              {otherUser.isOnline && ' • Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - flex-1 to take remaining space */}
      <div className="flex-1 overflow-y-auto p-4">
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
              const isMe = message.senderId === user!.uid;
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showTime = !previousMessage || 
                formatTime(previousMessage.createdAt) !== formatTime(message.createdAt);
              
              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMe
                          ? 'bg-white/10 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="break-words">{message.text}</p>
                      {isMe && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Icon 
                            icon={message.status === 'read' ? "lucide:check-check" : "lucide:check"} 
                            className={`text-xs ${message.status === 'read' ? 'text-blue-400' : 'text-white/60'}`}
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

      {/* Input - flex-shrink-0 to stay visible when keyboard opens */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#010b29]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={messageInputRef}
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