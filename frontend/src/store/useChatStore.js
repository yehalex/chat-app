import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { devtools } from "zustand/middleware";

export const useChatStore = create(
  devtools((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    unreadMessages: {},

    getUsers: async () => {
      set({ isUsersLoading: true });
      try {
        const res = await axiosInstance.get("/messages/users");
        set({ users: res.data });
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        set({ isUsersLoading: false });
      }
    },

    subscribeToUsers: () => {
      const socket = useAuthStore.getState().socket;
      if (!socket) return;

      socket.on("userConnected", async () => {
        await get().getUsers();
      });

      socket.on("userDisconnected", async () => {
        await get().getUsers();
      });
    },

    unsubscribeFromUsers: () => {
      const socket = useAuthStore.getState().socket;
      if (!socket) return;

      socket.off("userConnected");
      socket.off("userDisconnected");
    },

    getMessages: async (userId) => {
      set({ isMessagesLoading: true });
      try {
        const res = await axiosInstance.get(`/messages/${userId}`);
        set({ messages: res.data });
        // Clear unread count for this user
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [userId]: 0,
          },
        }));
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        set({ isMessagesLoading: false });
      }
    },

    subscribeToMessages: () => {
      const { selectedUser } = get();
      if (!selectedUser) return;

      const socket = useAuthStore.getState().socket;

      socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser =
          newMessage.senderId === selectedUser._id;
        if (!isMessageSentFromSelectedUser) return;

        set({
          messages: [...get().messages, newMessage],
        });
      });

      socket.on("newUnreadMessage", ({ senderId }) => {
        // Increment unread count for the sender
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [senderId]: (state.unreadMessages[senderId] || 0) + 1,
          },
        }));
      });

      socket.on("messagesRead", ({ readerId }) => {
        // Clear unread count when messages are read
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [readerId]: 0,
          },
        }));
      });
    },

    unsubscribeFromMessages: () => {
      const socket = useAuthStore.getState().socket;
      socket.off("newMessage");
      socket.off("newUnreadMessage");
      socket.off("messagesRead");
    },

    sendMessage: async (messageData) => {
      const { selectedUser, messages } = get();
      try {
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          messageData
        );
        set({ messages: [...messages, res.data] });
      } catch (error) {
        toast.error(error.response.data.message);
      }
    },

    setSelectedUser: (selectedUser) => {
      set({ selectedUser, messages: [] });
    },
  }))
);
