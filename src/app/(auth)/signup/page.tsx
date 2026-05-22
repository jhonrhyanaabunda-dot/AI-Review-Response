export default function SignupPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Request access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI Review Response is invite-only. Ask your agency admin to send you an invitation,
          or contact <a className="underline" href="mailto:sales@example.com">sales@example.com</a>.
        </p>
      </div>
    </div>
  );
}
