"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavbar";
import AdminFooter from "@/components/AdminFooter";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminDashboard() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Company");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const productsPerPage = 20;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [verified, setVerified] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");

  const CLOUDINARY_UPLOAD_PRESET = "qr_product_upload";
  const CLOUDINARY_CLOUD_NAME = "deijswbt1";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const tenantDoc = await getDoc(doc(db, "tenants", user.uid));
          if (tenantDoc.exists()) {
            const data = tenantDoc.data();
            setTenantSlug(data.tenantSlug);
            setCompanyName(data.companyName || "Company");
            setWhatsappNumber(data.whatsappNumber || "");
            await setDoc(doc(db, "slugs", data.tenantSlug), { uid: user.uid }, { merge: true });
          }
        } catch (err) {
          console.error("Error fetching tenantSlug:", err);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, []);

  const fetchProducts = async () => {
    if (!uid) return;
    try {
      const querySnapshot = await getDocs(collection(db, "tenants", uid, "products"));
      const productList: any[] = [];
      querySnapshot.forEach((docSnap) => {
        productList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(productList);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [uid]);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", `${tenantSlug}/${slugify(name)}`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !tenantSlug) return alert("Tenant not loaded");
    setLoading(true);

    try {
      await setDoc(doc(db, "tenants", uid, "settings", "theme"), { whatsappNumber }, { merge: true });

      const productData = {
        name,
        slug: slugify(name),
        price,
        description,
        batchNumber,
        expiryDate,
        verified,
        images,
        customFields: customFields.filter((field) => field.key && field.value),
      };

      if (editingId) {
        await updateDoc(doc(db, "tenants", uid, "products", editingId), productData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "tenants", uid, "products"), productData);
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description);
    setBatchNumber(product.batchNumber || "");
    setExpiryDate(product.expiryDate || "");
    setVerified(product.verified || false);
    setImages(product.images || []);
    setCoverIndex(0);
    setCustomFields(product.customFields || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (product: any) => {
    if (!uid) return;
    if (!confirm(`Delete ${product.name}?`)) return;
    try {
      await deleteDoc(doc(db, "tenants", uid, "products", product.id));
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setBatchNumber("");
    setExpiryDate("");
    setVerified(false);
    setImages([]);
    setCoverIndex(0);
    setCustomFields([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 7 - images.length);
    for (const file of files) {
      const url = await uploadImageToCloudinary(file);
      setImages((prev) => [...prev, url]);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const updateCustomField = (index: number, key: string, value: string) => {
    const updated = [...customFields];
    updated[index] = { key, value };
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    const updated = [...customFields];
    updated.splice(index, 1);
    setCustomFields(updated);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <AdminNavbar companyName={companyName} tenantSlug={tenantSlug || ""} />

      {/* Product Form */}
      <form
        onSubmit={handleAddOrUpdateProduct}
        className="bg-white p-4 rounded-lg shadow mb-6 space-y-3"
      >
        <h2 className="text-lg font-bold border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
">{editingId ? "Edit Product" : "Add Product"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product Name"
            className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <input
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          placeholder="Batch Number"
          className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          Verified Product
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="WhatsApp Number"
          className="border p-2 rounded w-full bg-white text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="file"
          multiple
          onChange={handleImageUpload}
          className="w-full"
          accept="image/*"
        />
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <div key={i} className="relative flex-shrink-0">
              <Image
                src={img}
                alt={`Image ${i}`}
                width={80}
                height={80}
                className={`rounded border ${i === coverIndex ? "border-green-500" : ""}`}
              />
              <div className="flex gap-1 absolute top-1 right-1">
                <button
                  type="button"
                  className="bg-green-500 text-white text-xs px-1 rounded"
                  onClick={() => setCoverIndex(i)}
                >
                  Cover
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white text-xs px-1 rounded"
                  onClick={() => removeImage(i)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div>
          {customFields.map((field, idx) => (
            <div key={idx} className="flex gap-2 mb-1">
              <input
                value={field.key}
                onChange={(e) => updateCustomField(idx, e.target.value, field.value)}
                placeholder="Field Name"
                className="border p-1 flex-1"
              />
              <textarea
                value={field.value}
                onChange={(e) => updateCustomField(idx, field.key, e.target.value)}
                placeholder="Field Value"
                className="border p-1 flex-1 h-20 whitespace-pre-wrap"
                style={{ whiteSpace: "pre-wrap" }}
              ></textarea>
              <button
                type="button"
                className="bg-red-500 text-white text-xs px-2 rounded"
                onClick={() => removeCustomField(idx)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
            onClick={addCustomField}
          >
            + Add Field
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
        </button>
      </form>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search products..."
          className="w-full sm:w-1/3 p-2 border rounded shadow-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Product List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {paginatedProducts.map((product) => {
          const productUrl = `${window.location.origin}/${tenantSlug}/product/${product.slug}`;
          return (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-2 flex flex-col items-center text-center"
            >
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-28 object-cover rounded mb-1"
                />
              )}
              <p className="font-semibold text-sm truncate">{product.name}</p>
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                <button
                  onClick={() => {
                    setQrValue(productUrl);
                    setQrModalOpen(true);
                  }}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
                >
                  QR
                </button>
                <button
                  onClick={() => router.push(`/${tenantSlug}/product/${product.slug}`)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * productsPerPage >= filteredProducts.length}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* QR Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow relative">
            <QRCodeCanvas value={qrValue} size={200} />
            <div className="flex gap-2 mt-3 justify-center">
              <a
                href={`data:image/svg+xml;utf8,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg">${qrValue}</svg>`
                )}`}
                download="qrcode.png"
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                Download
              </a>
              <button
                onClick={() => setQrModalOpen(false)}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminFooter />
    </div>
  );
}
