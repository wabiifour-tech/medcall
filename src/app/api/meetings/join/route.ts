import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingCode, userId } = body;

    if (!meetingCode || !userId) {
      return NextResponse.json(
        { error: "Meeting code and user ID are required" },
        { status: 400 }
      );
    }

    // Find meeting by code
    const meeting = await db.meeting.findUnique({
      where: { meetingCode: meetingCode.toUpperCase() },
      include: {
        host: {
          select: { id: true, name: true, matricNumber: true },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Meeting has ended or been cancelled" },
        { status: 400 }
      );
    }

    // Update status to LIVE if scheduled
    if (meeting.status === "SCHEDULED") {
      await db.meeting.update({
        where: { id: meeting.id },
        data: { status: "LIVE" },
      });
    }

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingCode: meeting.meetingCode,
        status: meeting.status === "SCHEDULED" ? "LIVE" : meeting.status,
        hostId: meeting.hostId,
        host: meeting.host,
        allowAttendance: meeting.allowAttendance,
      },
    });
  } catch (error) {
    console.error("Join meeting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
