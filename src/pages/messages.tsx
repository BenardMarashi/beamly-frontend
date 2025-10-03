// src/pages/messages.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Input, Avatar, Spinner, Badge, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ConversationService } from '../services/firebase-services';

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

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(conversationId === 'new');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load other user info
  useEffect(() => {
    const loadOtherUser = async () => {
      if (!user) return;
      
      let otherUserId: string | null = null;
      
      if (isNewConversation) {
        // New conversation - get user ID from query param
        otherUserId = searchParams.get('with');
      } else if (conversation) {
        // Existing conversation - get other participant
        otherUserId = conversation.participants.find((p: string) => p !== user.uid);
      }
      
      if (!otherUserId) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUser({
            id: userDoc.id,
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || '',
            userType: userData.userType || 'user',
            isOnline: userData.isOnline || false
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading other user:', error);
        setLoading(false);
      }
    };
    
    loadOtherUser();
  }, [user, conversation, isNewConversation, searchParams]);

  // Load conversation and messages (skip if new)
  useEffect(() => {
    if (!conversationId || conversationId === 'new' || !user) {
      setLoading(false);
      return;
    }
    
    // Load conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const unsubscribeConversation = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        setConversation({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    
    // Load messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(loadedMessages);
    });
    
    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId, user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newMessage.trim() || !otherUser || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      let currentConversationId = conversationId;
      
      // If new conversation, create it now
      if (isNewConversation) {
        const result = await ConversationService.findOrCreateConversation(
          user.uid,
          otherUser.id
        );
        
        if (!result.success || !result.conversationId) {
          toast.error(t('messages.failedToSend'));
          setNewMessage(messageText);
          setSending(false);
          return;
        }
        
        currentConversationId = result.conversationId;
        setIsNewConversation(false);
        
        // Navigate to the real conversation
        navigate(`/messages/${currentConversationId}`, { replace: true });
      }
      
      // Send message
      const result = await ConversationService.sendMessage({
        conversationId: currentConversationId!,
        senderId: user.uid,
        senderName: userData?.displayName || t('common.user'),
        recipientId: otherUser.id,
        text: messageText
      });

      if (!result.success) {
        toast.error(t('messages.failedToSend'));
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('messages.failedToSend'));
      setNewMessage(messageText);
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'messages', messageToDelete));
      toast.success(t('messages.messageDeleted'));
      setDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(t('messages.deleteFailed'));
    }
  };

  const confirmDelete = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalOpen(true);
  };

  const formatMessageTime = (timestamp: any) => {
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
        <div className="text-center p-4">
          <Icon icon="lucide:message-circle-x" className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{t('messages.userNotFound')}</p>
          <Button 
            onPress={() => navigate('/messages')}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            {t('messages.backToMessages')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#010b29] flex flex-col">
      {/* Header */}
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
            className={otherUser.userType === 'freelancer' ? "cursor-pointer" : ""}
            onClick={otherUser.userType === 'freelancer' ? () => navigate(`/freelancer/${otherUser.id}`) : undefined}
          />
        </Badge>
        
        <div className="flex-1">
          <h3 
            className={`font-semibold text-white ${otherUser.userType === 'freelancer' ? 'cursor-pointer hover:underline' : ''}`}
            onClick={otherUser.userType === 'freelancer' ? () => navigate(`/freelancer/${otherUser.id}`) : undefined}
          >
            {otherUser.displayName}
          </h3>
          <p className="text-sm text-gray-400 capitalize">
            {otherUser.userType === 'freelancer' ? t('messages.userTypes.freelancer') : 
            otherUser.userType === 'client' ? t('messages.userTypes.client') : t('messages.userTypes.user')}
            {otherUser.isOnline && ` • ${t('messages.online')}`}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:message-circle" className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">
              {isNewConversation ? t('messages.startNewConversation') : t('messages.noMessages')}
            </p>
            <p className="text-gray-400 text-sm">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === user?.uid;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwn && (
                      <Avatar
                        src={otherUser?.photoURL}
                        name={otherUser?.displayName}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="group relative">
                        <div
                          className={`p-3 rounded-lg ${
                            isOwn
                              ? 'bg-[#FCE90D] text-[#011241]'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="break-words text-sm">{message.text}</p>
                          {isOwn && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <Icon 
                                icon={message.status === 'read' ? "lucide:check-check" : "lucide:check"} 
                                className={`text-xs ${message.status === 'read' ? 'text-[#011241]' : 'text-[#011241]/60'}`}
                              />
                            </div>
                          )}
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => confirmDelete(message.id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                            title={t('messages.deleteMessage')}
                          >
                            <Icon icon="lucide:trash-2" className="text-red-400 text-sm" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 px-1">
                        {formatMessageTime(message.createdAt)}
                      </span>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#010b29]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messages.typeMessage')}
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
            className="bg-[#FCE90D] text-[#011241] hover:bg-[#FCE90D]/90"
          >
            <Icon icon="lucide:send" />
          </Button>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {t('messages.deleteMessageTitle')}
          </ModalHeader>
          <ModalBody>
            <p>{t('messages.deleteMessageConfirm')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="danger" onPress={handleDeleteMessage}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MessagesPage;