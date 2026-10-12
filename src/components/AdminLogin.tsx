import { useState } from "react";
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const ADMIN_USERNAME = "F4rizal";
const ADMIN_PASSWORD = "*F4r1zal#";

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      onLogin();
    } else {
      setError("Username atau password salah.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
          <ShieldCheck className="h-8 w-8 text-blue-300" />
        </div>
        <h1 className="text-xl font-extrabold sm:text-2xl">Panel Admin</h1>
        <p className="mt-1 text-xs text-slate-400">Masuk untuk mengelola data peserta ujian</p>
      </div>

      {/* Form card */}
      <div className="mx-auto w-full max-w-sm flex-1 px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-2xl"
          noValidate
        >
          <div className="mb-5 flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-800">Login Admin</h2>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Masukkan username"
                autoComplete="off"
                className={`w-full rounded-xl border-2 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-slate-700 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Masukkan password"
                autoComplete="off"
                className={`w-full rounded-xl border-2 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 transition-colors outline-none focus:border-slate-700 focus:bg-white ${
                  error ? "border-red-400" : "border-slate-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-4 text-base font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-slate-900"
          >
            <ShieldCheck className="h-5 w-5" />
            Masuk
          </button>
        </form>
      </div>

      {/* Back button */}
      <div className="px-6 pb-8 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke halaman ujian
        </button>
      </div>
    </div>
  );
}
