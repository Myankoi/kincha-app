import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Kincha Dashboard",
  description: "Secure admin monitoring for Kincir Challenge responses.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fbfbf9] flex flex-col">
      {children}
    </div>
  );
}
