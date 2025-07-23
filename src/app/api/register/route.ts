// src/app/api/register/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "E-Mail und Passwort sind erforderlich." }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: "Benutzer mit dieser E-Mail existiert bereits." }, { status: 409 })
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

    return NextResponse.json({ message: "Benutzer erfolgreich registriert.", user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Registrierungsfehler:", error)
    return NextResponse.json({ message: "Interner Serverfehler." }, { status: 500 })
  }
}