"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminNavbar({ companyName, tenantSlug }: { companyName: string; tenantSlug: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="bg-gray-700 text-white w-full px-4 py-4 flex items-center justify-between shadow sticky top-0 z-50">
      {/* Logo */}
      <div
        className="font-bold text-lg cursor-pointer"
        onClick={() => router.push(`/admin/${tenantSlug}`)}
      >
        Welcome {companyName}
      </div>

      {/* Hamburger Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden flex flex-col gap-[3px] focus:outline-none"
      >
        <span className="w-5 h-[2px] bg-white"></span>
        <span className="w-5 h-[2px] bg-white"></span>
        <span className="w-5 h-[2px] bg-white"></span>
      </button>

      {/* Menu */}
      <div
        className={`${
          menuOpen ? "block" : "hidden"
        } absolute sm:static top-14 left-0 bg-gray-600 sm:bg-transparent w-full sm:w-auto sm:flex sm:items-center`}
      >
        <ul className="flex flex-col sm:flex-row sm:gap-8 px-6 sm:px-0 w-full sm:w-auto">
          <li className="w-full sm:w-auto">
            <button
              onClick={() => router.push(`/admin/${tenantSlug}/manage`)}
              className="block py-2 sm:py-0 hover:underline w-full text-left"
            >
              Manage
            </button>
          </li>
          <li className="w-full sm:w-auto">
            <button
              onClick={handleLogout}
              className="block py-2 sm:py-0 hover:underline w-full text-left"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
