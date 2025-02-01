import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
      <form className="flex flex-col min-w-64 p-8 bg-white border border-gray-300 rounded-lg shadow-md">
        <h1 className="text-2xl font-medium mb-4">Forgot Password</h1>
        <p className="text-sm text-foreground mb-4">
          Remembered your password?
          <Link
            className="text-foreground font-medium underline ml-1"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
        </div>
        <SubmitButton
          pendingText="Sending Reset Link..."
          formAction={forgotPasswordAction}
        >
          Send Reset Link
        </SubmitButton>
        <FormMessage message={searchParams} />
        <Link href="/" className="mb-4 text-blue-500 underline">
          &larr; Back to Home
        </Link>
      </form>
    </div>
  );
}
