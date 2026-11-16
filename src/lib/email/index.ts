import "server-only";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import {
  InviteCodeEmail,
  LoginCredentialsEmail,
  NewRequestEmail,
  RequestRejectedEmail,
} from "./templates";
import { categoryLabel } from "../format";
import { excerpt } from "../sanitize";

// Brevo SMTP relay (smtp-relay.brevo.com:587, STARTTLS)
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const SENDER = {
  name: "مدونات آفاق",
  address: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_USER || "",
};

/** Absolute site URL for links inside emails. */
export function siteUrl(path = ""): string {
  const base = (process.env.WEBSITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

async function send(to: string, subject: string, element: ReactElement) {
  if (!process.env.BREVO_USER || !process.env.BREVO_SMTP_KEY) {
    console.error(`Email not sent ("${subject}"): BREVO_USER / BREVO_SMTP_KEY not set`);
    return;
  }
  try {
    await transporter.sendMail({
      from: SENDER,
      to,
      subject,
      html: await render(element),
      text: await render(element, { plainText: true }),
    });
  } catch (error) {
    // Emails are best-effort: never fail the user's action because of them
    console.error(`Email not sent ("${subject}"):`, error);
  }
}

export function sendInviteCode(to: string, data: { fullName: string; specialty: string; inviteCode: string }) {
  return send(
    to,
    "تم قبولك في مدونات آفاق",
    InviteCodeEmail({ ...data, registerUrl: siteUrl("/register") }),
  );
}

export function sendRequestRejected(to: string, data: { fullName: string; reason: string }) {
  return send(to, "تحديث حول طلب المدونة - مدونات آفاق", RequestRejectedEmail(data));
}

export function notifyAdminNewRequest(request: {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  experienceYears: number;
  sampleTitle: string;
  sampleCategory: string;
  sampleContent: string;
  motivation: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("Admin not notified of new request: ADMIN_EMAIL not set");
    return Promise.resolve();
  }
  return send(
    adminEmail,
    "طلب مدونة جديد - مدونات آفاق",
    NewRequestEmail({
      fullName: request.fullName,
      email: request.email,
      specialty: request.specialty,
      experienceYears: request.experienceYears,
      sampleTitle: request.sampleTitle,
      sampleCategory: categoryLabel(request.sampleCategory),
      sampleExcerpt: excerpt(request.sampleContent, 300),
      motivation: request.motivation,
      reviewUrl: siteUrl(`/admin/requests/${request.id}`),
    }),
  );
}

export function sendLoginCredentials(
  to: string,
  data: { fullName: string; username: string; tempPassword: string },
) {
  return send(
    to,
    "بيانات الدخول - مدونات آفاق",
    LoginCredentialsEmail({ ...data, loginUrl: siteUrl("/login") }),
  );
}
