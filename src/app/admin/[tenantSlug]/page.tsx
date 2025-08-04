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
import { signOut, onAuthStateChanged } from "firebase/auth";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const uploadImagesToCloudinary = async (files: FileList) => {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `${tenantSlug}/${slugify(name)}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      urls.push(data.secure_url);
    }
    return urls;
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !tenantSlug) return alert("Tenant not loaded");
    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        imageUrls = await uploadImagesToCloudinary(images);
      }

      const productData = {
        name,
        slug: slugify(name),
        price,
        description,
        images: imageUrls.length > 0 ? imageUrls : previewImages,
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
    setPreviewImages(product.images || []);
    setCustomFields(product.customFields || []);
  };

  const handleDelete = async (product: any) => {
    if (!uid) return;
    if (!confirm(`Delete ${product.name}?`)) return;

    try {
      await deleteDoc(doc(db, "tenants", uid, "products", product.id));

      await fetch(`/api/delete-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `${tenantSlug}/${product.slug}` }),
      });

      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setImages(null);
    setPreviewImages([]);
    setCustomFields([]);
  };

  const handleImagePreview = (files: FileList) => {
    setImages(files);
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    setPreviewImages(urls);
  };

  const removePreviewImage = (index: number) => {
    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const updateCustomField = (index: number, key: string, value: string) => {
    const updated = [...customFields];
    updated[index] = { key, value };
    setCustomFields(updated);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Admin Dashboard - {tenantSlug || "Loading..."}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Product Form */}
      <form
        onSubmit={handleAddOrUpdateProduct}
        className="bg-white p-4 rounded-lg shadow-lg mb-8 max-w-xl mx-auto space-y-4"
      >
        <input
          type="text"
          placeholder="Product Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Price"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <label className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100">
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleImagePreview(e.target.files)}
            className="hidden"
          />
          <span className="text-gray-500">📷 Click or Drag to Upload Images</span>
        </label>
        {previewImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {previewImages.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <Image
                  src={src}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="rounded object-cover w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => removePreviewImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Custom Fields */}
        <div>
          <h3 className="font-semibold mb-2">Custom Fields</h3>
          {customFields.map((field, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Field Name"
                value={field.key}
                onChange={(e) => updateCustomField(idx, e.target.value, field.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Field Value"
                value={field.value}
                onChange={(e) => updateCustomField(idx, field.key, e.target.value)}
                className="flex-1 p-2 border rounded"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomField}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            + Add Field
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !uid}
          className={`w-full py-2 rounded text-white ${
            loading || !uid ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>

      {/* Product List */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const productUrl = `${window.location.origin}/${tenantSlug}/product/${product.slug}`;
          return (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow-lg flex flex-col"
            >
              {product.images?.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}
              <h2 className="font-bold text-lg">{product.name}</h2>
              <p className="text-blue-600 font-semibold">₹{product.price}</p>
              <p className="text-gray-500 text-sm flex-1">{product.description}</p>

              {product.customFields?.length > 0 && (
                <div className="mt-2">
                  {product.customFields.map((field: { key: string; value: string }, idx: number) => (
                    <p key={idx} className="text-xs text-gray-600">
                      <strong>{field.key}:</strong> {field.value}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <QRCodeCanvas id={`qr-${product.id}`} value={productUrl} size={100} />
                <button
                  onClick={() => router.push(`/${tenantSlug}/product/${product.slug}`)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
