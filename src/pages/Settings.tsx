import React from 'react';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'light', name: 'Light', color: 'bg-white', accent: 'bg-slate-200', border: 'border-gray-200' },
  { id: 'dark', name: 'Dark', color: 'bg-slate-950', accent: 'bg-slate-800', border: 'border-slate-800' },
  { id: 'midnight-gold', name: 'Midnight Gold', color: 'bg-zinc-950', accent: 'bg-yellow-500', border: 'border-zinc-800' },
  { id: 'ocean', name: 'Ocean', color: 'bg-blue-50', accent: 'bg-blue-600', border: 'border-blue-200' },
  { id: 'forest', name: 'Forest', color: 'bg-emerald-50', accent: 'bg-emerald-600', border: 'border-emerald-200' },
  { id: 'rose', name: 'Rose', color: 'bg-rose-50', accent: 'bg-rose-600', border: 'border-rose-200' },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
          <CardDescription className="text-muted-foreground">
            Customize the look and feel of your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-foreground">Theme</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:border-primary/50",
                    theme === t.id ? "border-primary bg-accent/50" : "border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-full aspect-video rounded-md flex items-center justify-center overflow-hidden shadow-sm",
                    t.color,
                    t.border,
                    "border"
                  )}>
                    {t.accent && (
                      <div className={cn("w-1/2 h-1/2 rounded-full", t.accent)} />
                    )}
                    {theme === t.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
