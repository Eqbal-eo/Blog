import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const BRAND = "#8c4a21";

const styles = {
  body: {
    backgroundColor: "#f9f7f0",
    fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2ddd0",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px",
  },
  brand: { color: BRAND, fontSize: "22px", fontWeight: 700, margin: "0 0 24px" },
  heading: { color: "#222222", fontSize: "20px", margin: "0 0 16px" },
  text: { color: "#333333", fontSize: "15px", lineHeight: "1.9", margin: "0 0 12px" },
  box: {
    backgroundColor: "#f1e6dc",
    borderRadius: "8px",
    margin: "16px 0",
    padding: "16px",
  },
  code: {
    color: BRAND,
    fontFamily: "Consolas, monospace",
    fontSize: "28px",
    fontWeight: 700,
    letterSpacing: "6px",
    margin: 0,
    textAlign: "center" as const,
  },
  button: {
    backgroundColor: BRAND,
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    padding: "12px 24px",
    textDecoration: "none",
  },
  footer: { color: "#6a6969", fontSize: "12px", margin: 0 },
};

function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>مدونات آفاق</Text>
          {children}
          <Hr style={{ borderColor: "#e2ddd0", margin: "24px 0" }} />
          <Text style={styles.footer}>مدونات آفاق | منصة للتدوين الثقافي والفكري</Text>
        </Container>
      </Body>
    </Html>
  );
}

function P({ children }: { children: ReactNode }) {
  return <Text style={styles.text}>{children}</Text>;
}

export function InviteCodeEmail(props: {
  fullName: string;
  specialty: string;
  inviteCode: string;
  registerUrl: string;
}) {
  return (
    <Layout preview={`كود التفعيل الخاص بك: ${props.inviteCode}`}>
      <Heading style={styles.heading}>مرحباً {props.fullName}</Heading>
      <P>
        يسعدنا إبلاغك بقبول طلبك للانضمام إلى مدونات آفاق في مجال {props.specialty}.
      </P>
      <Section style={styles.box}>
        <Text style={styles.code}>{props.inviteCode}</Text>
      </Section>
      <P>استخدم هذا الكود لإكمال إنشاء حسابك. الكود صالح لمدة 7 أيام فقط.</P>
      <Button href={props.registerUrl} style={styles.button}>
        إكمال التسجيل
      </Button>
    </Layout>
  );
}

export function RequestRejectedEmail(props: { fullName: string; reason: string }) {
  return (
    <Layout preview="تحديث حول طلب المدونة">
      <Heading style={styles.heading}>عزيزي/عزيزتي {props.fullName}</Heading>
      <P>نشكرك على اهتمامك بالانضمام إلى مدونات آفاق.</P>
      <P>نأسف لإعلامك أنه لم يتم قبول طلبك هذه المرة للأسباب التالية:</P>
      <Section style={styles.box}>
        <Text style={{ ...styles.text, margin: 0, whiteSpace: "pre-line" }}>
          {props.reason}
        </Text>
      </Section>
      <P>يمكنك إعادة تقديم طلب جديد في أي وقت مع مراعاة الملاحظات المذكورة أعلاه.</P>
    </Layout>
  );
}

export function NewRequestEmail(props: {
  fullName: string;
  email: string;
  specialty: string;
  experienceYears: number;
  sampleTitle: string;
  sampleCategory: string;
  sampleExcerpt: string;
  motivation: string;
  reviewUrl: string;
}) {
  return (
    <Layout preview={`طلب مدونة جديد من ${props.fullName}`}>
      <Heading style={styles.heading}>طلب مدونة جديد</Heading>
      <Section style={styles.box}>
        <Text style={{ ...styles.text, margin: 0 }}>
          الاسم: {props.fullName}
          <br />
          البريد الإلكتروني: {props.email}
          <br />
          التخصص: {props.specialty}
          <br />
          سنوات الخبرة: {props.experienceYears}
        </Text>
      </Section>
      <P>
        <strong>المقال التجريبي:</strong> {props.sampleTitle} ({props.sampleCategory})
      </P>
      <P>{props.sampleExcerpt}</P>
      <P>
        <strong>الدافع للانضمام:</strong> {props.motivation}
      </P>
      <Button href={props.reviewUrl} style={styles.button}>
        مراجعة الطلب
      </Button>
    </Layout>
  );
}

export function LoginCredentialsEmail(props: {
  fullName: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
}) {
  return (
    <Layout preview="تم إنشاء حسابك في مدونات آفاق">
      <Heading style={styles.heading}>مرحباً {props.fullName}</Heading>
      <P>تم إنشاء حسابك بنجاح في مدونات آفاق!</P>
      <Section style={styles.box}>
        <Text style={{ ...styles.text, margin: 0 }}>
          اسم المستخدم: <strong dir="ltr">{props.username}</strong>
          <br />
          كلمة المرور المؤقتة: <strong dir="ltr">{props.tempPassword}</strong>
        </Text>
      </Section>
      <P>يرجى تسجيل الدخول ثم تغيير كلمة المرور من صفحة الإعدادات.</P>
      <Button href={props.loginUrl} style={styles.button}>
        تسجيل الدخول
      </Button>
    </Layout>
  );
}

export function ConfirmSubscriptionEmail(props: { scope: string; confirmUrl: string }) {
  return (
    <Layout preview="أكّد اشتراكك في مدونات آفاق">
      <Heading style={styles.heading}>أكّد اشتراكك</Heading>
      <P>طلبت الاشتراك لتصلك {props.scope} على هذا البريد.</P>
      <P>اضغط الزر لتأكيد الاشتراك. إن لم تطلب ذلك، تجاهل هذه الرسالة ولن نرسل لك شيئاً.</P>
      <Button href={props.confirmUrl} style={styles.button}>
        تأكيد الاشتراك
      </Button>
    </Layout>
  );
}

export function NewPostEmail(props: {
  title: string;
  authorName: string;
  excerpt: string;
  postUrl: string;
  unsubscribeUrl: string;
}) {
  return (
    <Layout preview={`${props.authorName}: ${props.title}`}>
      <Text style={{ ...styles.text, color: "#6a6969", margin: "0 0 4px" }}>
        تدوينة جديدة من {props.authorName}
      </Text>
      <Heading style={styles.heading}>{props.title}</Heading>
      <P>{props.excerpt}</P>
      <Button href={props.postUrl} style={styles.button}>
        اقرأ التدوينة
      </Button>
      <Text style={{ ...styles.footer, marginTop: "24px" }}>
        وصلتك هذه الرسالة لأنك مشترك في مدونات آفاق.{" "}
        <a href={props.unsubscribeUrl} style={{ color: "#6a6969" }}>
          إلغاء الاشتراك
        </a>
      </Text>
    </Layout>
  );
}
