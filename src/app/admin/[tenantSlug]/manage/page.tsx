"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ThemeManager() {
  const defaultTheme = {
    background: "#ffffff",
    primaryColor: "#1e40af",
    secondaryColor: "#9333ea",
    fontColor: "#000000", // 🔹 New Font Color
    fontFamily: "Inter",
    contentBackground: "#ffffff",
    fontSizeHeading: "24px",
    fontSizeDescription: "16px",
    fontSizeButton: "14px",
  };

  const [uid, setUid] = useState<string | null>(null);
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [previewTheme, setPreviewTheme] = useState<any>(defaultTheme);
  const [saving, setSaving] = useState(false);

  // Authentication & Fetch Theme
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "tenants", user.uid, "settings", "theme");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const loadedTheme = { ...defaultTheme, ...snap.data() };
          setTheme(loadedTheme);
          setPreviewTheme(loadedTheme);
        }
      }
    });
    return () => unsub();
  }, []);

  // Save Theme
  const saveTheme = async () => {
    if (!uid) return;
    setSaving(true);
    const docRef = doc(db, "tenants", uid, "settings", "theme");
    await setDoc(docRef, theme);
    setSaving(false);
    alert("Theme Saved ✅");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Left Controls */}
      <div className="lg:w-1/3 p-5 bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-5 text-gray-800">Theme Manager</h2>

        {/* Background */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Background</span>
          <input
            type="color"
            value={theme.background}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, background: val });
              setPreviewTheme({ ...previewTheme, background: val });
            }}
            className="w-full h-10 cursor-pointer border rounded"
          />
        </label>

        {/* Content Background */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Content Background</span>
          <input
            type="color"
            value={theme.contentBackground}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, contentBackground: val });
              setPreviewTheme({ ...previewTheme, contentBackground: val });
            }}
            className="w-full h-10 cursor-pointer border rounded"
          />
        </label>

        {/* Primary Color */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Primary Color</span>
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, primaryColor: val });
              setPreviewTheme({ ...previewTheme, primaryColor: val });
            }}
            className="w-full h-10 cursor-pointer border rounded"
          />
        </label>

        {/* Secondary Color */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Secondary Color</span>
          <input
            type="color"
            value={theme.secondaryColor}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, secondaryColor: val });
              setPreviewTheme({ ...previewTheme, secondaryColor: val });
            }}
            className="w-full h-10 cursor-pointer border rounded"
          />
        </label>

        {/* 🔹 Font Color */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Font Color</span>
          <input
            type="color"
            value={theme.fontColor}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, fontColor: val });
              setPreviewTheme({ ...previewTheme, fontColor: val });
            }}
            className="w-full h-10 cursor-pointer border rounded"
          />
        </label>

        {/* Font Family */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Font Family</span>
          <select
            value={theme.fontFamily}
            onChange={(e) => {
              const val = e.target.value;
              setTheme({ ...theme, fontFamily: val });
              setPreviewTheme({ ...previewTheme, fontFamily: val });
            }}
            className="w-full p-2 border rounded"
          >
            <option value="Inter">Inter</option>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
          </select>
        </label>

        {/* Font Sizes */}
        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Heading Font Size</span>
          <input
            type="number"
            value={parseInt(theme.fontSizeHeading)}
            onChange={(e) => {
              const val = `${e.target.value}px`;
              setTheme({ ...theme, fontSizeHeading: val });
              setPreviewTheme({ ...previewTheme, fontSizeHeading: val });
            }}
            className="w-full p-2 border rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Description Font Size</span>
          <input
            type="number"
            value={parseInt(theme.fontSizeDescription)}
            onChange={(e) => {
              const val = `${e.target.value}px`;
              setTheme({ ...theme, fontSizeDescription: val });
              setPreviewTheme({ ...previewTheme, fontSizeDescription: val });
            }}
            className="w-full p-2 border rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="block mb-1 font-semibold text-gray-700">Button Font Size</span>
          <input
            type="number"
            value={parseInt(theme.fontSizeButton)}
            onChange={(e) => {
              const val = `${e.target.value}px`;
              setTheme({ ...theme, fontSizeButton: val });
              setPreviewTheme({ ...previewTheme, fontSizeButton: val });
            }}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Save Button */}
        <button
          onClick={saveTheme}
          className={`w-full py-2 mt-3 rounded text-white transition ${
            saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>

      {/* Right Preview */}
      <div
        className="lg:w-2/3 p-5 flex items-center justify-center"
        style={{
          background: previewTheme.background,
          fontFamily: previewTheme.fontFamily,
        }}
      >
        <div
          className="w-full max-w-md rounded-xl shadow-xl p-6 text-center border"
          style={{
            background: previewTheme.contentBackground,
            color: previewTheme.fontColor, // 🔹 Apply font color globally
          }}
        >
          <h1
            className="font-bold mb-4"
            style={{
              color: previewTheme.fontColor,
              fontSize: previewTheme.fontSizeHeading,
            }}
          >
            Premium Store
          </h1>
          <p
            className="mb-6"
            style={{
              color: previewTheme.fontColor,
              fontSize: previewTheme.fontSizeDescription,
            }}
          >
            Customize your store design live!
          </p>
          <button
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: previewTheme.primaryColor,
              color: previewTheme.fontColor,
              fontSize: previewTheme.fontSizeButton,
            }}
          >
            Sample Button
          </button>
        </div>
      </div>
    </div>
  );
}
