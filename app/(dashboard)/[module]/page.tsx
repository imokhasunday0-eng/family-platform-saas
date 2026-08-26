import Link from "next/link";

const modules: Record<string, { title: string; description: string }> = {
  calendar: { title: "Calendar", description: "Family events, reminders and recurring schedules will live here." },
  "meal-planner": { title: "Meal Planner", description: "Plan meals, manage recipes and turn ingredients into grocery items." },
  grocery: { title: "Grocery List", description: "Keep a shared shopping list with categories, stores and purchased status." },
  chores: { title: "Chores", description: "Assign recurring chores, track completion and award points." },
  budget: { title: "Budget", description: "Track income, expenses, bills and savings goals." },
  chat: { title: "Family Chat", description: "Keep family conversations and shared attachments together." },
  notes: { title: "Notes", description: "Store shared notes, checklists and family information." },
  notifications: { title: "Notifications", description: "Centralize in-app, email and push notifications." },
  settings: { title: "Settings", description: "Configure family preferences, permissions, currency and timezone." },
};

export default async function ModulePage({ params }: { params: { module: string } }) {
  const item = modules[params.module];
  if (!item) return <main className="p-8"><h1 className="text-2xl font-semibold">Not found</h1></main>;
  return (
    <main className="p-5 md:p-8">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      <div className="mt-8 max-w-2xl rounded-2xl border bg-card p-8">
        <h1 className="text-3xl font-semibold">{item.title}</h1>
        <p className="mt-3 text-muted-foreground">{item.description}</p>
        <div className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Module foundation ready. Feature implementation proceeds from this route.</div>
      </div>
    </main>
  );
}
