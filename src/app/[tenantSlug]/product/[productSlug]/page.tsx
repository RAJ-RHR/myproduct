"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";

export default function ProductDetailPage() {
  const { tenantSlug, productSlug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState<string>("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

        // 🔹 Fetch Theme
        const themeDoc = await getDoc(doc(db, "tenants", uid, "settings", "theme"));
        if (themeDoc.exists()) {
          setTheme(themeDoc.data());
        }

        // 🔹 Fetch Product
        const q = query(
          collection(db, "tenants", uid, "products"),
          where("slug", "==", productSlug)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          // Keep cover image first
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

  // 🔹 Theme defaults
  const bg = theme?.background || "linear-gradient(to bottom right, #111, #000)";
  const contentBg = theme?.contentBackground || "rgba(31,31,31,0.9)";
  const font = theme?.fontFamily || "Inter, sans-serif";
  const primaryColor = theme?.primaryColor || "#ec4899";
  const secondaryColor = theme?.secondaryColor || "#9333ea";
  const headingSize = theme?.fontSizeHeading || "1.8rem";
  const descSize = theme?.fontSizeDescription || "1rem";
  const btnSize = theme?.fontSizeButton || "1rem";
  const fontColor = theme?.fontColor || "#ffffff";

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const prevImage = () => {
    setGalleryIndex((prev) =>
      prev > 0 ? prev - 1 : (product.images?.length || 1) - 1
    );
  };

  const nextImage = () => {
    setGalleryIndex((prev) =>
      prev < (product.images?.length || 1) - 1 ? prev + 1 : 0
    );
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen w-full px-2 sm:px-4 py-4"
      style={{
        background: bg,
        fontFamily: font,
      }}
    >
      <div
        className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row"
        style={{
          backgroundColor: contentBg,
          color: fontColor,
        }}
      >
        {/* Product Image Section */}
        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
          <div
            className="flex justify-center items-center w-full bg-gradient-to-b from-pink-500/30 to-black/60 p-4 rounded-xl cursor-pointer"
            style={{
              background: `linear-gradient(to bottom, ${secondaryColor}, rgba(0,0,0,0.9))`,
            }}
            onClick={() =>
              openGallery(product.images?.indexOf(activeImage) || 0)
            }
          >
            {activeImage && (
              <Image
                src={activeImage}
                alt={product.name}
                width={400}
                height={400}
                className="drop-shadow-[0_0_25px_rgba(255,0,255,0.7)] object-contain max-h-[60vh] w-auto"
              />
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {product.images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className={`border rounded-lg cursor-pointer flex-shrink-0 ${
                    activeImage === img ? "border-pink-500" : "border-gray-500"
                  }`}
                  onClick={() => {
                    setActiveImage(img);
                    openGallery(idx);
                  }}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    width={60}
                    height={60}
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="flex-1 p-4 md:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h1
              className="font-bold break-words"
              style={{
                fontSize: headingSize,
                color: fontColor,
              }}
            >
              {product.name}
            </h1>
            <div
              className="px-4 py-1 rounded-full text-sm font-bold shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              ₹{product.price}
            </div>
          </div>

          <p
            className="mt-2 whitespace-pre-wrap flex-1"
            style={{
              fontSize: descSize,
              color: fontColor,
            }}
          >
            {product.description}
          </p>

          {/* Custom Fields */}
          {product.customFields?.length > 0 && (
            <div className="mt-4 space-y-2">
              {product.customFields.map((field: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm border-b border-gray-700 pb-1"
                >
                  <span style={{ color: fontColor }}>{field.key}</span>
                  <span style={{ color: fontColor }}>{field.value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="mt-6 px-4 py-2 rounded w-full sm:w-auto"
            style={{
              backgroundColor: primaryColor,
              fontSize: btnSize,
              color: fontColor,
            }}
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* 🔹 Fullscreen Gallery Modal */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full z-50"
              onClick={() => setIsGalleryOpen(false)}
            >
              ✕
            </button>

            {/* Prev Button */}
            <button
              className="absolute left-2 sm:left-6 text-white text-3xl z-50"
              onClick={prevImage}
            >
              ‹
            </button>

            {/* Image */}
            <Image
              src={product.images[galleryIndex]}
              alt={`Gallery Image ${galleryIndex}`}
              width={800}
              height={800}
              className="object-contain max-h-[90vh] w-auto cursor-zoom-in"
            />

            {/* Next Button */}
            <button
              className="absolute right-2 sm:right-6 text-white text-3xl z-50"
              onClick={nextImage}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
