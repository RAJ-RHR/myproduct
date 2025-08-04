"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import Head from "next/head";

export default function ProductDetailPage() {
  const { tenantSlug, productSlug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (typeof tenantSlug !== "string") {
          setLoading(false);
          return;
        }

        const slugDoc = await getDoc(doc(db, "slugs", tenantSlug));
        if (!slugDoc.exists()) {
          setLoading(false);
          return;
        }

        const uid = slugDoc.data()?.uid;

        const themeDoc = await getDoc(doc(db, "tenants", uid, "settings", "theme"));
        if (themeDoc.exists()) {
          setTheme(themeDoc.data());
        }

        const q = query(
          collection(db, "tenants", uid, "products"),
          where("slug", "==", productSlug)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (Array.isArray(data.images) && data.coverIndex !== undefined) {
            const coverImg = data.images[data.coverIndex];
            data.images = [
              coverImg,
              ...data.images.filter((_, idx) => idx !== data.coverIndex),
            ];
          }
          setProduct(data);
          setActiveImage(data.images?.[0] || "");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantSlug, productSlug]);

  if (loading) return <div className="text-center py-10 text-white">Loading...</div>;
  if (!product) return <div className="text-center py-10 text-white">Product not found</div>;

  const t = {
    background: theme?.background || "linear-gradient(to bottom right, #111, #000)",
    contentBackground: theme?.contentBackground || "rgba(31,31,31,0.9)",
    fontFamily: theme?.fontFamily || "Inter, sans-serif",
    primaryColor: theme?.primaryColor || "#ec4899",
    fontColor: theme?.fontColor || "#ffffff",
    headingSize: theme?.fontSizeHeading || "1.8rem",
    descSize: theme?.fontSizeDescription || "1rem",
    borderColor: theme?.borderColor || "#333",
    borderWidth: theme?.borderWidth || "1px",
    borderRadius: theme?.borderRadius || "12px",
    padding: theme?.padding || "16px",
    margin: theme?.margin || "12px",
    expandBg: theme?.expandBackground || "rgba(236,72,153,0.15)",
  };

  const shareProduct = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${product.name}`,
          text: product.description,
          url: window.location.href,
        });
      } else {
        alert("Sharing not supported on this device.");
      }
    } catch {
    } finally {
      setSharing(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <>
      <Head>
        <title>{`${product.name} - Product Info`}</title>
        <meta name="description" content={product.description?.slice(0, 150) || "Product information"} />
      </Head>

      <div
        className="flex justify-center items-center min-h-screen w-full px-2 sm:px-4 py-4"
        style={{
          background: t.background,
          fontFamily: t.fontFamily,
          padding: t.padding,
        }}
      >
        <div
          className="w-full max-w-5xl overflow-hidden relative flex flex-col md:flex-row"
          style={{
            background: t.contentBackground,
            color: t.fontColor,
            border: `${t.borderWidth} solid ${t.borderColor}`,
            borderRadius: t.borderRadius,
            margin: t.margin,
          }}
        >
          {/* Image Section */}
          <div className="flex-1 flex flex-col items-center p-4 md:p-8">
            <div className="flex justify-between items-center w-full mb-3">
              <div></div>
              <button
                className={`p-2 rounded-full ${sharing ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: t.primaryColor, color: t.fontColor }}
                onClick={shareProduct}
                disabled={sharing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>

            <div
              className="relative w-full max-w-[400px] h-[400px] flex justify-center items-center"
              style={{
                border: `${t.borderWidth} solid ${t.borderColor}`,
                borderRadius: t.borderRadius,
              }}
            >
              <Image src={activeImage} alt={product.name} fill className="object-contain" />
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="cursor-pointer flex-shrink-0"
                    style={{
                      border: `${t.borderWidth} solid ${activeImage === img ? t.primaryColor : t.borderColor}`,
                      borderRadius: t.borderRadius,
                    }}
                    onClick={() => setActiveImage(img)}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} width={60} height={60} className="object-cover rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 p-4 md:p-8 flex flex-col">
            {/* Always Visible Name + Description */}
            <h1
              className="font-bold break-words border-b pb-2"
              style={{ fontSize: t.headingSize, color: t.fontColor, borderColor: t.borderColor }}
            >
              {product.name}
            </h1>

            <div className="mt-3 border-b pb-2" style={{ borderColor: t.borderColor }}>
              <h2 className="text-lg font-semibold">Description</h2>
              <p style={{ fontSize: t.descSize }}>{product.description}</p>
            </div>

            {/* Only Admin Added Fields */}
            {product.customFields?.length > 0 && product.customFields.map((field: any, idx: number) => (
              <div
                key={idx}
                className="mt-3 border-b"
                style={{ borderColor: t.borderColor, background: t.expandBg, borderRadius: t.borderRadius }}
              >
                <button
                  onClick={() => toggleSection(field.key)}
                  className="w-full flex justify-between items-center py-2 font-semibold"
                >
                  <span>{field.key}</span>
                  <span
                    className="transition-transform duration-300"
                    style={{ transform: openSection === field.key ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openSection === field.key ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                  style={{ fontSize: t.descSize }}
                >
                  <div className="pb-2 px-1">
                    {field.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
