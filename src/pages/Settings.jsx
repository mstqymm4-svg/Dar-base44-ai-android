import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  LogOut,
  Save,
  Languages,
  Info,
  Mail,
  ShieldCheck,
  AlertCircle,
  Lock,
  Trash2,
  ChevronDown,
  User,
  SlidersHorizontal,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobileSelect } from "@/components/ui/mobile-select";
import SettingRow from "@/components/SettingRow";
import ProfileCard from "@/components/ProfileCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MobileHeader from "@/components/MobileHeader";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { bookLangLabel, BOOK_LANG_VALUES } from "@/lib/i18n-terms";
import { getAccountEmail } from "@/lib/activeUser";
import { setThemeMode, getThemeState, subscribeToTheme } from "@/lib/themeEngine";
import { PageSpinner } from "@/components/Skeleton";

const ls = {
  get: (k, fb = "") => {
    try {
      return localStorage.getItem(k) || fb;
    } catch (e) {
      return fb;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
};

export default function Settings() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getThemeState().isDark);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("العربية");
  const [appLang, setAppLang] = useState(() => ls.get("dev_app_lang", "ar"));
  const [verified, setVerified] = useState(false);

  // Accordion state: every card is collapsed by default, opens only on click
  const [openSections, setOpenSections] = useState({
    profile: false,
    appearance: false,
    preferences: false,
    appLang: false,
    security: false,
    about: false,
    danger: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      profile: true,
      appearance: true,
      preferences: true,
      appLang: true,
      security: true,
      about: true,
      danger: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      profile: false,
      appearance: false,
      preferences: false,
      appLang: false,
      security: false,
      about: false,
      danger: false,
    });
  };

  const isAllOpen = Object.values(openSections).every(Boolean);

  useEffect(() => {
    loadUser();
    const unsub = subscribeToTheme(({ isDark }) => setDarkMode(isDark));
    const onVerified = () => {
      const em = getAccountEmail();
      try {
        setVerified(!!em && localStorage.getItem(`email_verified_${em}`) === "1");
      } catch {}
    };
    window.addEventListener("dau-email-verified", onVerified);
    return () => {
      unsub();
      window.removeEventListener("dau-email-verified", onVerified);
    };
  }, []);

  const loadUser = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      setNotifications(u.notifications_enabled ?? true);
      setLanguage(u.preferred_language || "العربية");
    }
    const em = getAccountEmail(u) || u?.email;
    try {
      setVerified(!!em && localStorage.getItem(`email_verified_${em}`) === "1");
    } catch (e) {}
    setLoading(false);
  };

  const handleToggleDark = (val) => {
    setDarkMode(val);
    setThemeMode(val ? "dark" : "light");
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      notifications_enabled: notifications,
      preferred_language: language,
    });
    toast.success(t.savePreferences + " ✓");
    setSaving(false);
  };

  const handleSaveAppLang = () => {
    ls.set("dev_app_lang", appLang);
    window.dispatchEvent(new Event("app-lang-change"));
    toast.success(t.applyLang + " ✓");
  };

  const handleLogout = () => {
    try {
      base44.auth.logout("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setTimeout(() => {
      try {
        localStorage.removeItem("base44_access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("dar_mock_user");
      } catch (e) {}
      window.location.replace("/");
    }, 600);
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.functions.invoke("deleteAccountRequest", {});
      toast.success(t.deleteRequestSent);
    } catch (e) {
      toast.error(t.deleteRequestFailed);
      return;
    }
    setTimeout(() => handleLogout(), 1000);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MobileHeader title={t.settings} />

      {/* Header with expand / collapse controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-foreground">{t.settings}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t.settingsSub}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isAllOpen ? collapseAll : expandAll}
            className="rounded-[4px_20px_4px_20px] text-xs h-8 px-3 gap-1.5"
          >
            {isAllOpen ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>طي جميع البطاقات</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>فتح جميع البطاقات</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* ─── 1. CARD: الملف الشخصي (Profile) ───────────────────────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.profile
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("profile")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    الملف الشخصي والصورة
                  </h2>
                  {verified && (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                      موثّق ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  تعديل الاسم، الصورة الشخصية، وتوثيق البريد الإلكتروني
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
                {openSections.profile ? "إخفاء التفاصيل" : "عرض وتعديل"}
              </span>
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.profile ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.profile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="p-2 sm:p-4">
                  <ProfileCard />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 2. CARD: المظهر والسمة (Appearance) ───────────────────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.appearance
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("appearance")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {t.appearance} والسمة
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {darkMode ? "داكن 🌙" : "فاتح ☀️"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  الوضع الليلي والنهاري ومظهر التطبيق
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.appearance ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.appearance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-4"
              >
                <SettingRow
                  title={t.darkMode}
                  description={t.darkModeSub}
                  control={
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-muted-foreground" />
                      <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
                      <Moon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  }
                />

                {/* Quick visual mode selectors */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDark(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      !darkMode
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <p className="text-xs font-bold text-foreground">الوضع النهاري</p>
                      <p className="text-[10px] text-muted-foreground">سطوع ووضوح للقراءة</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleDark(true)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      darkMode
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-start">
                      <p className="text-xs font-bold text-foreground">الوضع الليلي</p>
                      <p className="text-[10px] text-muted-foreground">مريح للعينين في الظلام</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 3. CARD: التفضيلات والتنبيهات (Preferences) ──────────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.preferences
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("preferences")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {t.preferences} والتنبيهات
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    {language}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  إشعارات الكتب الجديدة ولغة تصفية المحتوى
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.preferences ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.preferences && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-5"
              >
                <SettingRow
                  icon={<Bell className="w-4 h-4 text-primary" />}
                  title={t.notifications}
                  description={t.notificationsSub}
                  control={
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  }
                />

                <div className="pt-2 border-t border-border/60">
                  <Label className="text-xs font-bold">{t.preferredLang}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    {t.preferredLangSub}
                  </p>
                  <MobileSelect
                    value={language}
                    onValueChange={setLanguage}
                    placeholder={t.preferredLangPlaceholder}
                    triggerClassName="mt-1"
                    options={BOOK_LANG_VALUES.map((v) => ({
                      value: v,
                      label: bookLangLabel(v, t.langCode),
                    }))}
                  />
                </div>

                <Button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="gap-2 rounded-[4px_20px_4px_20px] w-full sm:w-auto text-xs h-10 shadow-xs"
                >
                  <Save className="w-4 h-4" /> {t.savePreferences}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 4. CARD: لغة واجهة التطبيق (App Language) ────────────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.appLang
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("appLang")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Languages className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {t.appLangTitle}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase">
                    {appLang}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {t.appLangSub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.appLang ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.appLang && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { code: "ar", name: "العربية", flag: "🇸🇦" },
                    { code: "en", name: "English", flag: "🇬🇧" },
                    { code: "fr", name: "Français", flag: "🇫🇷" },
                    { code: "ur", name: "اردو", flag: "🇵🇰" },
                    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
                    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
                  ].map(({ code, name, flag }) => (
                    <label
                      key={code}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        appLang === code
                          ? "border-primary bg-primary/10 shadow-2xs font-bold"
                          : "border-border/70 hover:border-primary/40 hover:bg-card"
                      }`}
                    >
                      <input
                        type="radio"
                        name="appLang"
                        value={code}
                        checked={appLang === code}
                        onChange={() => setAppLang(code)}
                        className="hidden"
                      />
                      <span className="text-base">{flag}</span>
                      <span className="text-xs flex-1">{name}</span>
                      {appLang === code && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleSaveAppLang}
                  className="gap-2 w-full sm:w-auto rounded-[4px_20px_4px_20px] text-xs h-10 shadow-xs"
                >
                  <Save className="w-4 h-4" /> {t.applyLang}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 5. CARD: الأمان والخصوصية (Security & Privacy) ───────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.security
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("security")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {t.securityTitle} والخصوصية
                  </h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      verified
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {verified ? "موثّق ومحمي ✓" : "غير موثّق"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  حماية البيانات وربط وتوثيق البريد الإلكتروني
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.security ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.security && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  {verified ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${
                        verified
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {verified ? t.securityVerified : t.securityUnverified}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {verified
                        ? "بريدك الإلكتروني محمي ومربوط بحسابك بنجاح. تتم مزامنة إشاراتك المرجعية ومفضلاتك بأمان."
                        : "قم بتأكيد بريدك الإلكتروني لحماية بياناتك والتمكن من استعادة حسابك والمزامنة في أي وقت."}
                    </p>
                    {!verified && (
                      <Link
                        to="/verify-email"
                        className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>توثيق البريد برمز OTP الآن</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60">
                  <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.securityPrivacySub}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 6. CARD: حول التطبيق والتواصل (About & Contact) ───────────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.about
              ? "border-primary/40 shadow-sm"
              : "border-border hover:border-primary/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("about")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Info className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {t.aboutTitle} والتواصل والدعم
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                    v2.5.0
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  معلومات الإصدار، فريق التطوير، وقنوات المساعدة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.about ? "rotate-180 text-primary" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.about && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-4"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.aboutContactSub}
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/about"
                    className="flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/15 transition-colors rounded-[4px_20px_4px_20px] shadow-2xs"
                  >
                    <Info className="w-4 h-4" /> <span>{t.aboutTitle}</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/15 transition-colors rounded-[4px_20px_4px_20px] shadow-2xs"
                  >
                    <Mail className="w-4 h-4" /> <span>{t.contactTitle}</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 7. CARD: إدارة الحساب والمنطقة الحساسة (Danger Zone) ──────── */}
        <div
          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-card ${
            openSections.danger
              ? "border-destructive/40 shadow-sm"
              : "border-border hover:border-destructive/30"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection("danger")}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 shadow-2xs">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  إدارة الجلسة والحساب
                </h2>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  تسجيل الخروج أو حذف الحساب نهائياً
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-transform duration-300 ${
                  openSections.danger ? "rotate-180 text-destructive" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openSections.danger && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-border/60 p-5 sm:p-6 space-y-5"
              >
                {/* Logout row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.logout}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.logoutSub}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2 rounded-[4px_20px_4px_20px] text-xs h-9 self-start sm:self-auto"
                  >
                    <LogOut className="w-3.5 h-3.5" /> <span>{t.logout}</span>
                  </Button>
                </div>

                {/* Account Deletion row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-destructive/[0.04] border border-destructive/20">
                  <div>
                    <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteAccount}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.deleteAccountSub}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="gap-2 rounded-[4px_20px_4px_20px] text-xs h-9 self-start sm:self-auto shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> <span>{t.deleteAccount}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteAccountConfirm}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.deleteAccountWarning}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          {t.deletePermanently}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}