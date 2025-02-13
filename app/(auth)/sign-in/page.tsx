import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { GoogleButton } from "./GoogleButton";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
      <form className="flex flex-col min-w-96 gap-y-2 p-8 bg-white border border-gray-300 rounded-lg shadow-md">
        <h1 className="text-2xl font-medium mb-4">Sign in</h1>
        <p className="text-sm text-foreground mb-4">
          Dont have an account?
          <Link
            className="text-foreground font-medium underline ml-1"
            href="/sign-up"
          >
            Sign up
          </Link>
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
        </div>
        <div className="flex justify-between items-center mb-4">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
          className="mb-4"
        />
        <SubmitButton pendingText="Signing In..." formAction={signInAction}>
          Sign in
        </SubmitButton>
        <FormMessage message={searchParams} />
        <GoogleButton />
        <Link href="/" className="mt-4 text-blue-500 underline">
          &larr; Back to Home
        </Link>
      </form>
    </div>
  );
}
