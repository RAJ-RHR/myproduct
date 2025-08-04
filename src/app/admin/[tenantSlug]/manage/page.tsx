"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const defaultTheme: Record<string, string> = {
  background: "#ffffff",
  contentBackground: "#ffffff",
  primaryColor: "#1e40af",
  secondaryColor: "#9333ea",
  fontColor: "#000000",
  fontFamily: "Inter",
  fontSizeHeading: "24px",
  fontSizeDescription: "16px",
  fontSizeButton: "14px",
  borderRadius: "8px",
  borderColor: "#cccccc",
  borderWidth: "1px",
  padding: "16px",
  margin: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  opacity: "1",
  fontWeight: "400",
};

// Auto options for select fields
const selectOptions: Record<string, string[]> = {
  fontFamily: ["Inter", "Poppins", "Roboto", "Montserrat"],
  fontWeight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
};

// Auto field type detection
function detectFieldType(key: string, value: string) {
  if (value.startsWith("#") && value.length <= 7) return "color";
  if (value.includes("rgba") || value.includes("rgb")) return "color";
  if (value.endsWith("px") || value.endsWith("rem") || value.endsWith("em") || value.endsWith("%"))
    return "size";
  if (!isNaN(Number(value)) && key.toLowerCase().includes("opacity")) return "range";
  if (!isNaN(Number(value)) && key.toLowerCase().includes("weight")) return "select";
  if (selectOptions[key]) return "select";
  if (value.includes("shadow")) return "text"; // Freeform shadow
  return "text";
}

export default function ThemeManager() {
  const [uid, setUid] = useState<string | null>(null);
  const [theme, setTheme] = useState<Record<string, string>>(defaultTheme);
  const [previewTheme, setPreviewTheme] = useState<Record<string, string>>(defaultTheme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const themeRef = doc(db, "tenants", user.uid, "settings", "theme");
        const snap = await getDoc(themeRef);
        if (snap.exists()) {
          const loadedTheme = { ...defaultTheme, ...snap.data() };
          setTheme(loadedTheme);
          setPreviewTheme(loadedTheme);
        } else {
          await setDoc(themeRef, defaultTheme);
        }
      }
    });
    return () => unsub();
  }, []);

  const saveTheme = async () => {
    if (!uid) return;
    setSaving(true);
    await setDoc(doc(db, "tenants", uid, "settings", "theme"), theme);
    setSaving(false);
    alert("Theme Saved ✅");
  };

  const handleChange = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setPreviewTheme((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Controls */}
      <div className="lg:w-1/3 p-5 bg-white shadow-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-5 text-gray-800">Theme Manager</h2>

        {Object.entries(theme).map(([key, value]) => {
          const type = detectFieldType(key, value);

          return (
            <label key={key} className="block mb-4">
              <span className="block mb-1 font-semibold text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </span>

              {type === "color" && (
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full h-10 cursor-pointer border rounded"
                />
              )}

              {type === "size" && (
                <input
                  type="number"
                  value={parseInt(value)}
                  onChange={(e) => handleChange(key, `${e.target.value}px`)}
                  className="w-full p-2 border rounded"
                />
              )}

              {type === "range" && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={parseFloat(value)}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full"
                />
              )}

              {type === "select" && (
                <select
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {selectOptions[key]?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {type === "text" && (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full p-2 border rounded"
                />
              )}
            </label>
          );
        })}

        <button
          onClick={saveTheme}
          disabled={saving}
          className={`w-full py-2 mt-3 rounded text-white transition ${saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>

      {/* Preview */}
      <div
        className="lg:w-2/3 p-5 flex items-center justify-center"
        style={{
          background: previewTheme.background,
          fontFamily: previewTheme.fontFamily,
          padding: previewTheme.padding,
        }}
      >
        <div
          className="w-full max-w-md text-center shadow-xl"
          style={{
            background: previewTheme.contentBackground,
            color: previewTheme.fontColor,
            border: `${previewTheme.borderWidth} solid ${previewTheme.borderColor}`,
            borderRadius: previewTheme.borderRadius,
            margin: previewTheme.margin,
            padding: previewTheme.padding,
            boxShadow: previewTheme.boxShadow,
            opacity: previewTheme.opacity,
            fontWeight: previewTheme.fontWeight as any,
          }}
        >
          <h1 className="font-bold mb-4" style={{ fontSize: previewTheme.fontSizeHeading }}>
            Premium Store
          </h1>
          <p className="mb-6" style={{ fontSize: previewTheme.fontSizeDescription }}>
            Customize your store design live!
          </p>
          <button
            className="px-4 py-2"
            style={{
              backgroundColor: previewTheme.primaryColor,
              color: previewTheme.fontColor,
              fontSize: previewTheme.fontSizeButton,
              borderRadius: previewTheme.borderRadius,
              border: `${previewTheme.borderWidth} solid ${previewTheme.borderColor}`,
              boxShadow: previewTheme.boxShadow,
            }}
          >
            Sample Button
          </button>
        </div>
      </div>
    </div>
  );
}
