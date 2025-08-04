"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";

export default function ProductDetailPage() {
  const { tenantSlug, productSlug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const slugDoc = await getDoc(doc(db, "slugs", tenantSlug));
        if (!slugDoc.exists()) {
          setLoading(false);
          return;
        }

        const uid = slugDoc.data()?.uid;
        const q = query(
          collection(db, "tenants", uid, "products"),
          where("slug", "==", productSlug)
        );
        const snap = await getDocs(q);
        if (!snap.empty) setProduct(snap.docs[0].data());
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [tenantSlug, productSlug]);

  if (loading) return <div className="text-center py-10 text-white">Loading...</div>;
  if (!product) return <div className="text-center py-10 text-white">Product not found</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Price Tag */}
        <div className="absolute top-4 right-4 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
          ₹{product.price}
        </div>

        {/* Product Image */}
        <div className="flex justify-center p-6 bg-gradient-to-b from-purple-700 to-gray-900 relative">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={250}
              height={250}
              className="drop-shadow-[0_0_25px_rgba(255,0,255,0.7)]"
            />
          )}
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-300 mt-2">{product.description}</p>

          {/* Ratings */}
          <div className="flex items-center gap-1 mt-3 text-pink-400">
            ★★★★☆
          </div>

          {/* Custom Fields */}
          {product.customFields?.length > 0 && (
            <div className="mt-4 space-y-2">
              {product.customFields.map((field: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm border-b border-gray-700 pb-1">
                  <span className="text-gray-400">{field.key}</span>
                  <span className="text-gray-200">{field.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
