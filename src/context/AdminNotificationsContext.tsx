
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Notification = {
  id: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  eventType: string;
};

type AdminNotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  hasPendingReports: boolean;
  hasPendingOwners: boolean;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationsProvider');
  }
  return context;
}

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPendingReports, setHasPendingReports] = useState(false);
  const [hasPendingOwners, setHasPendingOwners] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];
    
    // Notifications listener
    const notifsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    unsubs.push(onSnapshot(notifsQuery, snapshot => {
      const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifsData);
      setUnreadCount(notifsData.filter(n => !n.read).length);
    }, error => console.error("Error fetching notifications:", error)));

    // Pending reports listener
    const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'Pending'));
    unsubs.push(onSnapshot(reportsQuery, snapshot => {
        setHasPendingReports(!snapshot.empty);
    }, error => console.error("Error fetching reports:", error)));

    // Pending owners listener
    const ownersQuery = query(collection(db, 'rideOwners'), where('status', '==', 'Pending Approval'));
    unsubs.push(onSnapshot(ownersQuery, snapshot => {
        setHasPendingOwners(!snapshot.empty);
    }, error => console.error("Error fetching ride owners:", error)));

    setIsLoading(false);
    return () => unsubs.forEach(unsub => unsub());

  }, [user, authLoading]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({ variant: 'destructive', title: 'Could not mark as read.' });
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    const unreadQuery = query(collection(db, 'notifications'), where('read', '==', false));
    try {
      const unreadSnapshot = await getDocs(unreadQuery);
      if (unreadSnapshot.empty) return;

      const batch = writeBatch(db);
      unreadSnapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
      toast({ title: 'All notifications marked as read.' });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({ variant: 'destructive', title: 'Could not mark all as read.' });
    }
  }, [toast]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast({ title: 'Notification deleted.' });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({ variant: 'destructive', title: 'Could not delete notification.' });
    }
  }, [toast]);

  const value = {
    notifications,
    unreadCount,
    hasPendingReports,
    hasPendingOwners,
    isLoading: authLoading || isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}
