'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { MapPin, Search } from 'lucide-react';
import { NIGERIAN_CITIES } from '@/lib/data';

const formSchema = z.object({
  from: z.string().min(1, 'Please select a pickup location'),
  to: z.string().optional(),
  type: z.string(),
});

export function RideSearchForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: '',
      to: '',
      type: 'Any',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams({
        from: values.from,
        ...(values.to && { to: values.to }),
        type: values.type,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-0 bg-background p-3 rounded-lg shadow-2xl"
      >
        <div className="md:col-span-3">
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">From</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <SelectTrigger className="pl-10 h-12 text-base md:rounded-r-none border-0 md:border-r">
                          <SelectValue placeholder="Pickup Location" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {NIGERIAN_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">To</FormLabel>
                <FormControl>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Destination (optional)"
                          className="pl-10 h-12 text-base md:rounded-r-none md:rounded-l-none border-0 md:border-r"
                          {...field}
                        />
                    </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="md:col-span-1">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Ride Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base md:rounded-r-none md:rounded-l-none border-0">
                      <SelectValue placeholder="Ride Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Any">Any Type</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Keke">Keke</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <div className="md:col-span-1">
            <Button type="submit" className="w-full h-12 text-base md:rounded-l-none">
                <Search className="mr-2 h-5 w-5" />
                Search
            </Button>
        </div>
      </form>
    </Form>
  );
}
