"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bell } from "lucide-react";

export function NotificationWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((notification: { title: string; message: string }) => {
              toast.info(notification.title, {
                description: notification.message,
                duration: 6000,
                icon: <Bell className="h-4.5 w-4.5 text-[#C97C5D]" />,
              });
            });
          }
        }
      } catch (error) {
        console.error("Failed to poll notifications:", error);
      }
    };

    // Poll immediately on load
    checkNotifications();

    // Poll every 10 seconds
    const interval = setInterval(checkNotifications, 10000);

    return () => clearInterval(interval);
  }, [session]);

  return null; // Logic-only watcher
}
