import { AppLayout } from "@/components/AppLayout";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div className="mt-6 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium">
          Em breve
        </div>
      </div>
    </AppLayout>
  );
}
