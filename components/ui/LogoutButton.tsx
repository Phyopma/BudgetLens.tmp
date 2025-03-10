'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="absolute right-16 top-4"
      title="Logout"
    >
      <LogOut className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}