
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, UserCheck, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Stat = {
  title: string;
  value: string | number;
  icon: React.ElementType;
};

type Notification = {
  id: string;
  message: string;
  time: string;
  createdAt: Timestamp;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { title: "Active Ride Owners", value: 0, icon: Users },
    { title: "Live Vehicle Listings", value: 0, icon: Car },
    { title: "Pending Approvals", value: 0, icon: UserCheck },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // --- Stats Listeners ---
    const qOwners = query(collection(db, "rideOwners"), where("status", "==", "Active"));
    const unsubOwners = onSnapshot(qOwners, (snapshot) => {
        setStats(prev => prev.map(s => s.title === "Active Ride Owners" ? { ...s, value: snapshot.size } : s));
    });
    unsubscribes.push(unsubOwners);

    const qListings = query(collection(db, "listings"), where("status", "in", ["Approved", "Promoted"]));
    const unsubListings = onSnapshot(qListings, (snapshot) => {
        setStats(prev => prev.map(s => s.title === "Live Vehicle Listings" ? { ...s, value: snapshot.size } : s));
    });
    unsubscribes.push(unsubListings);

    const qPending = query(collection(db, "rideOwners"), where("status", "==", "Pending Approval"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
        setStats(prev => prev.map(s => s.title === "Pending Approvals" ? { ...s, value: snapshot.size } : s));
         setIsLoading(false); // Assume loading is done after first stat is calculated
    });
    unsubscribes.push(unsubPending);


    // --- Notifications Listener ---
    const qNotifications = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notificationsData);
    });
    unsubscribes.push(unsubNotifications);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const formatTimeAgo = (timestamp: Timestamp | undefined) => {
      if (!timestamp) return 'Just now';
      const now = new Date();
      const past = timestamp.toDate();
      const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return Math.floor(seconds) + "s ago";
  };


  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                  <Skeleton className="h-8 w-1/4" />
              ) : (
                 <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 font-headline">Notifications</h2>
        <Card>
          <CardContent className="p-0">
             {isLoading ? (
                <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : notifications.length === 0 ? (
                 <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No new notifications</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Updates and alerts will appear here.
                    </p>
                </div>
            ) : (
                <div className="divide-y">
                {notifications.map((note) => (
                    <div key={note.id} className="flex items-start gap-4 p-4">
                    <div className="bg-muted p-2 rounded-full">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="grid gap-1">
                        <p className="font-medium">{note.message}</p>
                        <p className="text-sm text-muted-foreground">{formatTimeAgo(note.createdAt)}</p>
                    </div>
                    </div>
                ))}
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
