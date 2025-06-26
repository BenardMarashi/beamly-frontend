// src/components/messaging/MessagesPage.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, Avatar, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ChatWindow } from './ChatWindow';

interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: { [key: string]: number };
}

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getOtherParticipant = (conversation: Conversation) => {
    const otherIndex = conversation.participants[0] === user?.uid ? 1 : 0;
    return {
      id: conversation.participants[otherIndex],
      name: conversation.participantNames[otherIndex]
    };
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="glass-card lg:col-span-1 h-full">
          <CardBody className="p-4">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
              className="mb-4"
            />
            
            <div className="space-y-2 overflow-y-auto">
              {filteredConversations.map((conversation) => {
                const other = getOtherParticipant(conversation);
                const unreadCount = conversation.unreadCount?.[user?.uid!] || 0;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id
                        ? 'bg-beamly-primary/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={other.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-white truncate">
                            {other.name}
                          </h3>
                          {unreadCount > 0 && (
                            <span className="bg-beamly-primary text-white text-xs px-2 py-1 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Chat Window */}
        <Card className="glass-card lg:col-span-2 h-full">
          <CardBody className="p-0 h-full">
            {selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation}
                recipientId={getOtherParticipant(
                  conversations.find(c => c.id === selectedConversation)!
                ).id}
                recipientName={getOtherParticipant(
                  conversations.find(c => c.id === selectedConversation)!
                ).name}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Icon icon="lucide:message-circle" className="text-6xl mb-4 mx-auto" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};