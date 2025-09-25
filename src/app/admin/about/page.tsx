
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, UploadCloud, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function AboutUsEditorPage() {
    const [isLoading, setIsLoading] = useState(false); // Changed to false, will be true when fetching data
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    
    // State for each editable section
    const [mission, setMission] = useState('');
    const [vision, setVision] = useState('');
    const [values, setValues] = useState<string[]>(['']);
    const [howItWorks, setHowItWorks] = useState<string[]>(['']);
    const [whyChooseUs, setWhyChooseUs] = useState<string[]>(['']);

    const { toast } = useToast();

    // Placeholder functions for dynamic lists
    const handleAddListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
    };
    const handleRemoveListItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };
    const handleListItemChange = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => {
            const newItems = [...prev];
            newItems[index] = value;
            return newItems;
        });
    };

    const DynamicListSection = ({ title, items, setter }: { title: string, items: string[], setter: React.Dispatch<React.SetStateAction<string[]>> }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <Label>{title}</Label>
                 <Button type="button" size="sm" variant="ghost" onClick={() => handleAddListItem(setter)}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input value={item} onChange={e => handleListItemChange(index, e.target.value, setter)} placeholder={`Item ${index + 1}`} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => handleRemoveListItem(index, setter)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">About Us Editor</h1>
                    <p className="text-muted-foreground">Manage the content displayed on your public 'About Us' page.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" disabled>
                        <Save className="mr-2 h-4 w-4" /> Save Draft
                    </Button>
                    <Button disabled>
                        <UploadCloud className="mr-2 h-4 w-4" /> Publish
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mission">Our Mission</Label>
                                <Textarea id="mission" value={mission} onChange={e => setMission(e.target.value)} placeholder="To connect people with safe, reliable, and affordable transportation..." rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vision">Our Vision</Label>
                                <Textarea id="vision" value={vision} onChange={e => setVision(e.target.value)} placeholder="To be the leading ride-sharing platform in Nigeria..." rows={3} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Sections</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DynamicListSection title="Our Values" items={values} setter={setValues} />
                            <DynamicListSection title="How It Works (Steps)" items={howItWorks} setter={setHowItWorks} />
                            <DynamicListSection title="Why Choose Us" items={whyChooseUs} setter={setWhyChooseUs} />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>This is how the content will appear on the page.</CardDescription>
                        </CardHeader>
                        <CardContent className="prose prose-sm max-w-none">
                            <p className="text-center text-muted-foreground">Preview will appear here.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
