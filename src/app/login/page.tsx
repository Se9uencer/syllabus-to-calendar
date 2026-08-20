import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">syllabus-to-calendar</h1>
          <p className="text-sm text-neutral-500">
            Sign in with the email this account was created for.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
