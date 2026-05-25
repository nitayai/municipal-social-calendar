import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-[#0f0f0f] dark:to-[#171717]">
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="p-4 text-center text-xs text-gray-400 dark:text-gray-600">
        מערכת שיווק ·{" "}<a href="https://nitay.ai" target="_blank" rel="noopener noreferrer" className="hover:underline">nitay.ai</a>
      </footer>
    </div>
  );
}
