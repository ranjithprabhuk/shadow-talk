import { create } from 'zustand';
import { Message, MessageStatus } from '@/types';

interface ChatState {
  // Group messages
  groupMessages: Message[];

  // Private messages: Map<peerId, Message[]>
  privateMessages: Map<string, Message[]>;

  // Unread counts: Map<peerId, number>
  unreadCounts: Map<string, number>;

  // Group message actions
  addGroupMessage: (message: Message) => void;
  updateGroupMessageStatus: (messageId: string, status: MessageStatus) => void;
  clearGroupMessages: () => void;

  // Private message actions
  addPrivateMessage: (peerId: string, message: Message) => void;
  updatePrivateMessageStatus: (peerId: string, messageId: string, status: MessageStatus) => void;
  getPrivateMessages: (peerId: string) => Message[];
  clearPrivateMessages: (peerId: string) => void;

  // Unread count actions
  getUnreadCount: (peerId: string) => number;
  incrementUnreadCount: (peerId: string) => void;
  clearUnreadCount: (peerId: string) => void;

  // Clear all
  clearAll: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  groupMessages: [],
  privateMessages: new Map(),
  unreadCounts: new Map(),

  // Group messages
  addGroupMessage: (message) =>
    set((state) => ({
      groupMessages: [...state.groupMessages, message],
    })),

  updateGroupMessageStatus: (messageId, status) =>
    set((state) => ({
      groupMessages: state.groupMessages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    })),

  clearGroupMessages: () => set({ groupMessages: [] }),

  // Private messages
  addPrivateMessage: (peerId, message) =>
    set((state) => {
      const newPrivateMessages = new Map(state.privateMessages);
      const existingMessages = newPrivateMessages.get(peerId) || [];
      newPrivateMessages.set(peerId, [...existingMessages, message]);
      return { privateMessages: newPrivateMessages };
    }),

  updatePrivateMessageStatus: (peerId, messageId, status) =>
    set((state) => {
      const newPrivateMessages = new Map(state.privateMessages);
      const messages = newPrivateMessages.get(peerId);
      if (messages) {
        newPrivateMessages.set(
          peerId,
          messages.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
        );
      }
      return { privateMessages: newPrivateMessages };
    }),

  getPrivateMessages: (peerId) => get().privateMessages.get(peerId) || [],

  clearPrivateMessages: (peerId) =>
    set((state) => {
      const newPrivateMessages = new Map(state.privateMessages);
      newPrivateMessages.delete(peerId);
      return { privateMessages: newPrivateMessages };
    }),

  // Unread counts
  getUnreadCount: (peerId) => get().unreadCounts.get(peerId) || 0,

  incrementUnreadCount: (peerId) =>
    set((state) => {
      const newUnreadCounts = new Map(state.unreadCounts);
      const currentCount = newUnreadCounts.get(peerId) || 0;
      newUnreadCounts.set(peerId, currentCount + 1);
      return { unreadCounts: newUnreadCounts };
    }),

  clearUnreadCount: (peerId) =>
    set((state) => {
      const newUnreadCounts = new Map(state.unreadCounts);
      newUnreadCounts.set(peerId, 0);
      return { unreadCounts: newUnreadCounts };
    }),

  // Clear all
  clearAll: () =>
    set({
      groupMessages: [],
      privateMessages: new Map(),
      unreadCounts: new Map(),
    }),
}));
