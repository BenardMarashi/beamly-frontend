import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Input, Button, Avatar, Badge } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { filterMessageText } from '@/utils/chatFilter';


interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantPhotos: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: { [key: string]: number };
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check for target user parameter
    const userParam = searchParams.get('user');
    if (userParam) {
      setTargetUserId(userParam);
    }
    
    const unsubscribe = loadConversations();
    return unsubscribe;
  }, [user, navigate, searchParams]);

  // Handle target user selection and conversation creation
  useEffect(() => {
    if (!targetUserId || !user || conversations.length === 0) return;
    
    // Find existing conversation with target user
    const existingConversation = conversations.find(conv => 
      conv.participants.includes(targetUserId)
    );
    
    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      // Create a placeholder conversation for new chat
      createNewConversationWithUser(targetUserId);
    }
    
    // Clear the URL parameter
    setTargetUserId(null);
  }, [targetUserId, user, conversations]);

  const createNewConversationWithUser = async (userId: string) => {
    try {
      // Fetch user data for the conversation
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        toast.error(t('chat.errors.userNotFound'));
        return;
      }
      
      const targetUser = userDoc.data();
      const conversationId = [user!.uid, userId].sort().join('_');
      
      // Create a local conversation object for immediate UI update
      const newConversation: Conversation = {
        id: conversationId,
        participants: [user!.uid, userId],
        participantNames: {
          [user!.uid]: userData?.displayName || user!.displayName || t('common.you'),
          [userId]: targetUser.displayName || t('common.user')
        },
        participantPhotos: {
          [user!.uid]: userData?.photoURL || user!.photoURL || '',
          [userId]: targetUser.photoURL || ''
        },
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: {}
      };
      
      setSelectedConversation(newConversation);
      toast.success(t('chat.startedConversation', { name: targetUser.displayName }));
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error(t('chat.errors.failedToStart'));
    }
  };
  
  useEffect(() => {
    if (!selectedConversation) return;
    
    const unsubscribe = loadMessages(selectedConversation.id);
    return unsubscribe;
  }, [selectedConversation]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const loadConversations = () => {
    if (!user) return () => {};
    
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({
          id: doc.id,
          ...doc.data()
        } as Conversation);
      });
      setConversations(convos);
      setLoading(false);
    });
    
    return unsubscribe;
  };
  
  const loadMessages = (conversationId: string) => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(msgs);
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
    });
    
    return unsubscribe;
  };
  
  const markMessagesAsRead = async (conversationId: string) => {
    if (!user || !selectedConversation) return;
    
    try {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== user.uid && !msg.read
      );
      
      for (const msg of unreadMessages) {
        await updateDoc(
          doc(db, 'conversations', conversationId, 'messages', msg.id),
          { read: true }
        );
      }
      
      // Update conversation unread count
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${user.uid}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
    const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    const messageText = newMessage.trim();
    const filteredText = filterMessageText(messageText);
    setNewMessage('');
    
    try {
      // Use Firebase function for sending messages
      const sendMessageFn = httpsCallable(functions, 'sendMessage');
      const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
      
      await sendMessageFn({
        conversationId: selectedConversation.id,
        recipientId: otherParticipantId,
        text: filteredText,  // <-- CHANGE THIS LINE
        attachments: []
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('chat.errors.failedToSend'));
      // Rollback message input if error
      setNewMessage(messageText);
    }
  };
  
  const getOtherParticipant = (conversation: Conversation) => {
    const otherParticipantId = conversation.participants.find(p => p !== user?.uid);
    return {
      id: otherParticipantId || '',
      name: conversation.participantNames[otherParticipantId || ''] || t('common.unknown'),
      photo: conversation.participantPhotos[otherParticipantId || ''] || ''
    };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">{t('chat.loadingConversations')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-[calc(100vh-200px)]"
      >
        <h1 className="text-3xl font-bold text-white mb-8">{t('chat.title')}</h1>
        
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Conversations List */}
          <div className="col-span-4">
            <Card className="glass-effect border-none h-full">
              <CardBody className="p-0 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon icon="lucide:message-square" className="text-gray-400 mb-4 mx-auto" width={48} />
                    <p className="text-gray-400">{t('chat.noConversations')}</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const unreadCount = conversation.unreadCount[user!.uid] || 0;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-white/5 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-white/10' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge 
                            content={unreadCount} 
                            color="danger" 
                            isInvisible={unreadCount === 0}
                          >
                            <Avatar
                              src={otherParticipant.photo}
                              name={otherParticipant.name}
                              size="md"
                            />
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {otherParticipant.name}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conversation.lastMessageTime?.toDate ? 
                              new Date(conversation.lastMessageTime.toDate()).toLocaleDateString() : 
                              t('common.recently')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>
          </div>
          
          {/* Chat Area */}
          <div className="col-span-8">
            <Card className="glass-effect border-none h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={getOtherParticipant(selectedConversation).photo}
                        name={getOtherParticipant(selectedConversation).name}
                        size="sm"
                      />
                      <h2 className="text-white font-medium">
                        {getOtherParticipant(selectedConversation).name}
                      </h2>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <CardBody className="flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 ${
                          message.senderId === user?.uid ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                            message.senderId === user?.uid
                              ? 'bg-primary text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.createdAt?.toDate ? 
                              new Date(message.createdAt.toDate()).toLocaleTimeString() : 
                              t('chat.sending')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </CardBody>
                  
                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('chat.typeMessage')}
                        variant="bordered"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        color="primary"
                        isIconOnly
                        disabled={!newMessage.trim()}
                      >
                        <Icon icon="lucide:send" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <Icon icon="lucide:message-square" className="text-gray-400 mb-4 mx-auto" width={64} />
                    <p className="text-gray-400">{t('chat.selectConversation')}</p>
                  </div>
                </CardBody>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatPage;