import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Check if student has signed attendance for a meeting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const studentId = searchParams.get("studentId");

    if (!meetingId || !studentId) {
      return NextResponse.json(
        { error: "Meeting ID and Student ID are required" },
        { status: 400 }
      );
    }

    // Check for existing attendance
    const existingAttendance = await db.attendance.findUnique({
      where: {
        meetingId_studentId: {
          meetingId,
          studentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      hasSigned: !!existingAttendance,
      attendance: existingAttendance
        ? {
            id: existingAttendance.id,
            signInTime: existingAttendance.signInTime,
            status: existingAttendance.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Check attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Sign attendance (CRITICAL SECURITY LOGIC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, studentId, ipAddress, userAgent } = body;

    // Validation
    if (!meetingId || !studentId) {
      return NextResponse.json(
        { error: "Meeting ID and Student ID are required" },
        { status: 400 }
      );
    }

    // Verify student exists and is locked
    const student = await db.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can sign attendance" },
        { status: 403 }
      );
    }

    // Verify meeting exists and is live
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (!meeting.allowAttendance) {
      return NextResponse.json(
        { error: "Attendance is disabled for this meeting" },
        { status: 400 }
      );
    }

    if (meeting.status !== "LIVE") {
      return NextResponse.json(
        { error: "Meeting is not currently live" },
        { status: 400 }
      );
    }

    // CRITICAL: Check for duplicate attendance using unique constraint
    const existingAttendance = await db.attendance.findUnique({
      where: {
        meetingId_studentId: {
          meetingId,
          studentId,
        },
      },
    });

    if (existingAttendance) {
      // Duplicate attempt - REJECT
      return NextResponse.json(
        {
          error: "Attendance already signed",
          attendance: {
            id: existingAttendance.id,
            signInTime: existingAttendance.signInTime,
            status: existingAttendance.status,
          },
        },
        { status: 409 } // Conflict
      );
    }

    // Determine attendance status based on time
    const now = new Date();
    const meetingStart = new Date(meeting.startTime);
    const minutesSinceStart = (now.getTime() - meetingStart.getTime()) / (1000 * 60);
    
    let attendanceStatus: "PRESENT" | "LATE" = "PRESENT";
    if (minutesSinceStart > 15) {
      attendanceStatus = "LATE";
    }

    // Create attendance record with SERVER timestamp
    const attendance = await db.attendance.create({
      data: {
        meetingId,
        studentId,
        status: attendanceStatus,
        ipAddress: ipAddress || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: userAgent || request.headers.get("user-agent") || "unknown",
        signInTime: now, // Server-side timestamp for integrity
        synced: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance signed successfully",
      attendance: {
        id: attendance.id,
        signInTime: attendance.signInTime,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error("Sign attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Sync offline attendance records
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body; // Array of offline attendance records

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records to sync" },
        { status: 400 }
      );
    }

    const results = [];

    for (const record of records) {
      const { meetingId, studentId, timestamp } = record;

      // Check if already synced
      const existing = await db.attendance.findUnique({
        where: {
          meetingId_studentId: { meetingId, studentId },
        },
      });

      if (existing) {
        results.push({
          id: record.id,
          success: true,
          alreadyExists: true,
        });
        continue;
      }

      // Verify the meeting exists
      const meeting = await db.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        results.push({
          id: record.id,
          success: false,
          error: "Meeting not found",
        });
        continue;
      }

      // Create attendance record
      try {
        await db.attendance.create({
          data: {
            meetingId,
            studentId,
            status: "PRESENT",
            signInTime: new Date(timestamp),
            synced: true,
          },
        });

        results.push({
          id: record.id,
          success: true,
        });
      } catch (e) {
        results.push({
          id: record.id,
          success: false,
          error: "Failed to create attendance",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Sync attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
