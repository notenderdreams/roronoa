import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function Sent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <>
      We sent a verification link
      {email ? (
        <>
          {" "}
          to <b>{email}</b>
        </>
      ) : null}
      . Click it to activate your account, then log in.
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            <Suspense fallback="Loading…">
              <Sent searchParams={searchParams} />
            </Suspense>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No email? Check spam, or log in again to get a fresh link.
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to log in</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
