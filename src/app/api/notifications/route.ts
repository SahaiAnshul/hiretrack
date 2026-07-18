import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch unread notifications
    const notifications = await db.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (notifications.length > 0) {
      // Mark them as read
      await db.notification.updateMany({
        where: {
          id: { in: notifications.map((n) => n.id) },
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
