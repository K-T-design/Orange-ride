import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2 } from "lucide-react";

const rideCategories = ['Bike', 'Keke', 'Car', 'Bus', 'VIP'];
const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];


export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>

            <Tabs defaultValue="categories">
                <TabsList>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Ride Categories</CardTitle>
                            <CardDescription>Add, edit, or delete ride categories.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex gap-2">
                                <Input placeholder="New category name" />
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {rideCategories.map(cat => (
                                    <div key={cat} className="flex items-center justify-between p-2 rounded-md border">
                                        <span>{cat}</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Locations</CardTitle>
                            <CardDescription>Add or delete Nigerian cities and towns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="New location name" />
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {locations.map(loc => (
                                     <div key={loc} className="flex items-center justify-between p-2 rounded-md border">
                                        <span>{loc}</span>
                                         <Button variant="ghost" size="sm" className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}