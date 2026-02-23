import { authenticateUser } from "@/app/utils/user-data";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { InputWithCheck } from "./ui/input-with-check";
import { Label } from "./ui/label";

interface LoginProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => void;
  onRegister: () => void;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!username.trim()) {
      setError(t("auth.errorUsernameEmpty"));
      return;
    }

    if (!password.trim()) {
      setError(t("auth.errorPasswordEmpty"));
      return;
    }

    // Authenticate user using the user database
    const user = authenticateUser(username, password);

    if (!user) {
      setError(t("auth.errorInvalidCredentials"));
      return;
    }

    // Successfully authenticated
    onLogin(username, password, rememberMe);
  };

  // Check if form is valid
  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            {/* SAPOM Logo with Gold Theme */}
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full opacity-20 blur-xl"></div>

              {/* Main logo container */}
              <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-8 rounded-2xl shadow-2xl">
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>

                {/* Logo text */}
                <div className="relative">
                  <h1 className="text-5xl font-bold text-white tracking-wider drop-shadow-lg">
                    SAPOM
                  </h1>
                  {/* Gold accent line */}
                  <div className="mt-2 h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent rounded-full"></div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-200 rounded-tl-lg"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-200 rounded-tr-lg"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-200 rounded-bl-lg"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-200 rounded-br-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            {t("auth.welcomeBack")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <InputWithCheck
                id="username"
                type="text"
                placeholder={t("auth.enterUsername")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <InputWithCheck
                id="password"
                type="password"
                placeholder={t("auth.enterPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {t("auth.rememberMe")}
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFormValid}
            >
              {t("auth.login")}
            </Button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={onRegister}
                  className="text-amber-600 hover:text-amber-700 font-semibold hover:underline"
                >
                  {t("auth.registerHere")}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
