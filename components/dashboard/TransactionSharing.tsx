"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationManager } from "./InvitationManager";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTransactions } from "@/hooks/useTransactions";

interface TransactionSharingProps {
  className?: string;
}

export function TransactionSharing({ className }: TransactionSharingProps) {
  const { fetchTransactions } = useTransactions();
  const [includeShared, setIncludeShared] = useState(true);

  const handleToggleShared = (checked: boolean) => {
    setIncludeShared(checked);
    fetchTransactions({ includeShared: checked });
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transaction Sharing</h2>
        <div className="flex items-center space-x-2">
          <Switch
            id="include-shared"
            checked={includeShared}
            onCheckedChange={handleToggleShared}
          />
          <Label htmlFor="include-shared">Include shared transactions</Label>
        </div>
      </div>

      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="invitations">
          <InvitationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}