import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matricNumber, password } = body;

    // Validation
    if (!matricNumber || !password) {
      return NextResponse.json(
        { error: "Matric number and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { matricNumber: matricNumber.toUpperCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Lock profile after login
    if (!user.profileLocked) {
      await db.user.update({
        where: { id: user.id },
        data: { profileLocked: true },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        matricNumber: user.matricNumber,
        role: user.role,
        profileLocked: true,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
