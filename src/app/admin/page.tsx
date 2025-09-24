import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, UserCheck, Bell } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Active Ride Owners", value: "125", icon: Users },
    { title: "Live Vehicle Listings", value: "340", icon: Car },
    { title: "Pending Approvals", value: "12", icon: UserCheck },
  ];

  const notifications = [
    { message: "New subscription payment: ₦10,000 (Weekly)", time: "5m ago" },
    { message: "New ride owner 'Bayo Adekunle' pending approval.", time: "1h ago" },
    { message: "New listing 'Toyota Camry 2022' pending approval.", time: "2h ago" },
    { message: "Subscription for 'City Movers Ltd.' has expired.", time: "1d ago" },
  ];

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
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 font-headline">Notifications</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((note, index) => (
                <div key={index} className="flex items-start gap-4 p-4">
                  <div className="bg-muted p-2 rounded-full">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid gap-1">
                    <p className="font-medium">{note.message}</p>
                    <p className="text-sm text-muted-foreground">{note.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}