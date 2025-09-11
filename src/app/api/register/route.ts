// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// src/app/api/register/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "E-Mail and password required." }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 })
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10) // 10 ist die Salt Rounds

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword // Gehashtes Passwort speichern
      }
    })

    return NextResponse.json({ message: "Registration successfull.", user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ message: "Internal Servererror." }, { status: 500 })
  }
}