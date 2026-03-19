import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Get meeting details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, matricNumber: true },
        },
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, matricNumber: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingCode: meeting.meetingCode,
        status: meeting.status,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        host: meeting.host,
        allowAttendance: meeting.allowAttendance,
        attendanceCount: meeting.attendances.length,
        attendances: meeting.attendances.map((a) => ({
          id: a.id,
          signInTime: a.signInTime,
          status: a.status,
          student: a.student,
        })),
      },
    });
  } catch (error) {
    console.error("Get meeting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update meeting status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, hostId } = body;

    // Verify ownership
    const meeting = await db.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (meeting.hostId !== hostId) {
      return NextResponse.json(
        { error: "Only the host can update this meeting" },
        { status: 403 }
      );
    }

    const updatedMeeting = await db.meeting.update({
      where: { id },
      data: {
        status,
        endTime: status === "ENDED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Update meeting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
