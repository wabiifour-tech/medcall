import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Get all meetings for a host
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get("hostId");

    if (!hostId) {
      return NextResponse.json(
        { error: "Host ID is required" },
        { status: 400 }
      );
    }

    const meetings = await db.meeting.findMany({
      where: { hostId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        meetingCode: m.meetingCode,
        status: m.status,
        startTime: m.startTime,
        endTime: m.endTime,
        attendanceCount: m._count.attendances,
      })),
    });
  } catch (error) {
    console.error("Get host meetings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
