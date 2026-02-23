import { Languages, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { LanguageCode } from "../utils/user-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SettingsProps {
  onLogout: () => void;
  username?: string;
  onLanguageChange?: (language: LanguageCode) => void;
  currentLanguage?: LanguageCode;
}

export function Settings({
  onLogout,
  username,
  onLanguageChange,
  currentLanguage,
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  const handleLanguageChange = (value: string) => {
    const language = value as LanguageCode;
    i18n.changeLanguage(language);
    localStorage.setItem("userLanguage", language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold mb-4">{t("settings.title")}</h1>

      {/* User Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{username || "User"}</h2>
            <p className="text-sm text-gray-500">
              {t("settings.accountSettings")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Account Information */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">
              {t("settings.accountInformation")}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("settings.username")}:</span>
                <span className="font-medium">{username || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("settings.status")}:</span>
                <span className="text-green-600 font-medium">
                  {t("settings.active")}
                </span>
              </div>
            </div>
          </div>

          {/* Language Preference */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">
              {t("settings.languagePreference")}
            </h3>
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-gray-600" />
              <Select
                value={currentLanguage || i18n.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("settings.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language.english")}</SelectItem>
                  <SelectItem value="id">{t("language.indonesian")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logout Button */}
          <div className="border-t pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogoutClick}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("auth.logout")}
            </Button>
          </div>
        </div>
      </Card>

      {/* App Information */}
      <Card className="p-6">
        <h3 className="font-medium mb-3">{t("settings.appInformation")}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("settings.appName")}:</span>
            <span className="font-medium">SAPOM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("settings.version")}:</span>
            <span className="font-medium">1.0.0</span>
          </div>
        </div>
      </Card>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.confirmLogout")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.confirmLogoutMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("auth.logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
