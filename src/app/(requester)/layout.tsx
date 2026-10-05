import Link from "next/link";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import type { ReactNode } from "react";

export default function RequesterLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "16px 24px 0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Link href="/catalog">ServiceFlow</Link>
        <SignOutButton />
      </header>
      {children}
    </>
  );
}
