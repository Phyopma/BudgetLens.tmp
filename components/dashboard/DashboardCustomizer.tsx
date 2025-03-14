"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AVAILABLE_COMPONENTS } from '@/lib/utils/constants';


interface DashboardCustomizerProps {
  onAddComponent: (componentType: string) => void;
  activeComponents: string[];
}

export function DashboardCustomizer({ onAddComponent, activeComponents }: DashboardCustomizerProps) {
  const [open, setOpen] = useState(false);

  const availableComponents = AVAILABLE_COMPONENTS.filter(
    (component) => !activeComponents.includes(component.type)
  );


  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mb-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Dashboard Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Dashboard Component</DialogTitle>
          <DialogDescription>
            Choose a component to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {availableComponents.map((component) => {
              return (
                <Card
                  key={component.id}
                  className={`cursor-pointer transition-colors hover:bg-accent`}
                  onClick={() => {
                    onAddComponent(component.type);
                    setOpen(false);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{component.title}</CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
