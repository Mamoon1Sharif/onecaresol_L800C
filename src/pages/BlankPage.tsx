import { AppLayout } from "@/components/AppLayout";

export default function BlankPage({ title }: { title?: string }) {
  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-black text-white flex items-center justify-center rounded-md">
        <h1 className="text-2xl font-semibold opacity-80">{title ?? "Coming soon"}</h1>
      </div>
    </AppLayout>
  );
}
