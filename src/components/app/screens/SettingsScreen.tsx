'use client'

// Settings screen: sound, dark mode, language (EN/AR with RTL), text scale.
// Saves preferences to the server via /api/auth/update-settings so they persist
// across sessions and don't get overwritten by HomeScreen's hydrateFromUser().

import { useSettingsStore } from '@/store/settings-store'
import { useSound } from '@/hooks/use-sound'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQueryClient } from '@tanstack/react-query'

export function SettingsScreen() {
  const s = useSettingsStore()
  const sfx = useSound()
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const qc = useQueryClient()

  // Save to server whenever a preference changes
  async function saveToServer(data: { language?: string; darkMode?: boolean; textScale?: string; soundEnabled?: boolean }) {
    try {
      await fetch('/api/auth/update-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      // Refresh the user query so /api/auth/me returns updated preferences
      qc.invalidateQueries({ queryKey: ['me'] })
    } catch {
      // Best-effort — local store already has the change
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10 space-y-4">
      <h1 className="text-3xl font-black">{t(s.lang, 'settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(s.lang, 'sound')}</CardTitle>
          <CardDescription>{s.soundEnabled ? t(s.lang, 'soundOn') : t(s.lang, 'soundOff')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound">{t(s.lang, 'sound')}</Label>
            <Switch
              id="sound"
              checked={s.soundEnabled}
              onCheckedChange={(v) => {
                s.setSound(v)
                if (v) sfx('click')
                saveToServer({ soundEnabled: v })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(s.lang, 'darkMode')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark">{t(s.lang, 'darkMode')}</Label>
            <Switch
              id="dark"
              checked={s.darkMode}
              onCheckedChange={(v) => {
                s.setDarkMode(v)
                saveToServer({ darkMode: v })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(s.lang, 'language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={s.lang}
            onValueChange={(v) => {
              s.setLang(v as 'en' | 'ar')
              saveToServer({ language: v })
              toast({ title: v === 'ar' ? 'تم تغيير اللغة' : 'Language changed' })
            }}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lang-en" value="en" />
              <Label htmlFor="lang-en">English</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lang-ar" value="ar" />
              <Label htmlFor="lang-ar">العربية</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t(s.lang, 'textScale')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={s.textScale}
            onValueChange={(v) => {
              s.setTextScale(v as 'sm' | 'md' | 'lg')
              saveToServer({ textScale: v })
            }}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="ts-sm" value="sm" />
              <Label htmlFor="ts-sm">{t(s.lang, 'small')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="ts-md" value="md" />
              <Label htmlFor="ts-md">{t(s.lang, 'medium')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="ts-lg" value="lg" />
              <Label htmlFor="ts-lg">{t(s.lang, 'large')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{s.lang === 'ar' ? 'الحساب' : 'Account'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p><strong>{t(s.lang, 'nickname')}:</strong> {user.nickname}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>{t(s.lang, 'pickAgeBand')}:</strong> {user.ageBand ?? '—'}</p>
            <p className="mt-3 text-xs">
              {t(s.lang, 'madeForKids')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
