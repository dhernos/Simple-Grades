// src/app/api/forgot-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Konfiguration des E-Mail-Transporters
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true", // true für Port 465, false für andere Ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Sende eine generische Antwort, um nicht zu verraten, ob die E-Mail existiert
      return NextResponse.json(
        {
          message:
            "Verification Email has been sent.",
        },
        { status: 200 }
      );
    }

    // Erstelle einen eindeutigen Token mit einer Ablaufzeit von 1 Stunde
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = await bcrypt.hash(resetToken, 10);
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 Stunde
    console.log("Aktuelles Datum +1h:", new Date(Date.now() + 3600000));
    // Speichere den gehashten Token im Benutzerdatensatz
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    // Sende die E-Mail
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Reset your Password",
      html: `
        <p>Hello there,</p>
        <p>Here is the link required to reset your passowrd:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link is valid for 60 Minutes.</p>
        <p>If you didn't request a passowrd reset you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        message:
          "Verification Email has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending Passwort-Reset-E-Mail:", error);
    return NextResponse.json({ message: "Internal Servererror." }, { status: 500 });
  }
}