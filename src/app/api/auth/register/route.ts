import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, matricNumber, password, role = "STUDENT" } = body;

    // Validation
    if (!name || !matricNumber || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if matric number already exists
    const existingUser = await db.user.findUnique({
      where: { matricNumber: matricNumber.toUpperCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Matric number already registered" },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        matricNumber: matricNumber.toUpperCase(),
        email: `${matricNumber.toLowerCase()}@medcall.local`,
        passwordHash: hashedPassword,
        role: role === "HOST" ? "HOST" : "STUDENT",
        profileLocked: false,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        matricNumber: user.matricNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
