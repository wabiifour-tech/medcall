import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMeetingCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, hostId, maxParticipants = 100 } = body;

    if (!title || !hostId) {
      return NextResponse.json(
        { error: "Title and host ID are required" },
        { status: 400 }
      );
    }

    // Verify host exists and has HOST role
    const host = await db.user.findUnique({
      where: { id: hostId },
    });

    if (!host || host.role !== "HOST") {
      return NextResponse.json(
        { error: "Invalid host or insufficient permissions" },
        { status: 403 }
      );
    }

    // Create meeting with unique code
    const meetingCode = generateMeetingCode();
    const meeting = await db.meeting.create({
      data: {
        title,
        description,
        hostId,
        meetingCode,
        maxParticipants,
        status: "SCHEDULED",
        startTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meetingCode: meeting.meetingCode,
        status: meeting.status,
        startTime: meeting.startTime,
      },
    });
  } catch (error) {
    console.error("Create meeting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
