import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, fns } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Button, Avatar } from '@heroui/react';
import { Icon } from '@iconify/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: any;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatWindowProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  recipientId,
  recipientName,
  recipientAvatar
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to messages
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(newMessages);
      scrollToBottom();
      markMessagesAsRead();
    });

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!user?.uid || !conversationId) return;

    try {
      // Update unread count in conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${user.uid}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sendMessageFn = httpsCallable(fns, 'sendMessage');
      await sendMessageFn({
        recipientId,
        text: newMessage.trim(),
        attachments: []
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <Avatar src={recipientAvatar} name={recipientName} size="sm" />
        <div>
          <h3 className="font-semibold text-white">{recipientName}</h3>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.senderId === user?.uid
                  ? 'bg-beamly-primary text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <span className="text-xs opacity-70">
                {new Date(message.createdAt?.toDate()).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            type="submit"
            color="primary"
            isIconOnly
            disabled={!newMessage.trim() || sending}
          >
            <Icon icon="lucide:send" />
          </Button>
        </div>
      </form>
    </div>
  );
};