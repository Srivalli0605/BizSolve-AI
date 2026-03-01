import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");

  const [form, setForm] = useState({ name: "", description: "", image_url: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API}/products/`, { headers: headers() });
      setProducts(res.data);
    } catch { setError("Failed to load products."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", image_url: "" });
    setImageFile(null);
    setImagePreview("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || "", image_url: p.image_url || "" });
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setError("");
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Product name is required."); return; }
    setSaving(true);
    setError("");
    try {
      let image_url = form.image_url;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await axios.post(`${API}/products/upload-image`, fd, {
          headers: { ...headers(), "Content-Type": "multipart/form-data" },
        });
        image_url = res.data.image_url;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: image_url || null,
      };

      if (editProduct) {
        await axios.patch(`${API}/products/${editProduct.id}`, payload, { headers: headers() });
      } else {
        await axios.post(`${API}/products/`, payload, { headers: headers() });
      }

      await loadProducts();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save product.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/products/${id}`, { headers: headers() });
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch { setError("Failed to delete product."); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Products
          </h2>
          <p style={{ color: "var(--muted)", fontWeight: 300, fontSize: "0.875rem" }}>
            {products.length} product{products.length !== 1 ? "s" : ""} · used in website generation
          </p>
        </div>
        <button onClick={openAdd} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", background: "var(--accent)", border: "none",
          borderRadius: 8, color: "var(--bg)", fontWeight: 600, fontSize: "0.875rem", cursor: "none",
        }}>
          <span style={{ fontSize: "1rem" }}>+</span> Add Product
        </button>
      </div>

      {error && !showForm && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#f87171", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1rem" }}>
              {editProduct ? "Edit Product" : "New Product"}
            </div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "1.2rem", cursor: "none" }}>×</button>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: "0.85rem", color: "#f87171", marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Left — form fields */}
            <div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Product Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Chic Denim Jeans"
                  maxLength={200}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Description <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. High-waist slim fit, available in 5 colors"
                  maxLength={300}
                />
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4, textAlign: "right", opacity: 0.5 }}>
                  {form.description.length}/300
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: "11px 20px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--muted)", fontSize: "0.875rem", cursor: "none",
                }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, padding: "11px", background: saving ? "rgba(232,213,163,0.4)" : "var(--accent)",
                  border: "none", borderRadius: 8, color: "var(--bg)",
                  fontWeight: 600, fontSize: "0.875rem", cursor: "none",
                }}>
                  {saving ? "Saving..." : editProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </div>

            {/* Right — image upload */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Product Image <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  width: "100%",
                  /* FIX: enough height to show full image without cropping */
                  minHeight: 180,
                  borderRadius: 10,
                  border: `2px dashed ${imagePreview ? "var(--accent2)" : "var(--border)"}`,
                  background: imagePreview ? "#0a0a0c" : "rgba(255,255,255,0.02)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "none", overflow: "hidden", position: "relative",
                  transition: "border-color 0.2s",
                }}
              >
                {imagePreview ? (
                  <>
                    {/* FIX: contain so full image is visible */}
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Change image</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📸</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 300 }}>Click to upload</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", opacity: 0.5, marginTop: 4 }}>JPG, PNG, WEBP</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(""); setForm(f => ({ ...f, image_url: "" })); }}
                  style={{ marginTop: 8, background: "none", border: "none", color: "var(--muted)", fontSize: "0.78rem", cursor: "none", textDecoration: "underline" }}>
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT GRID */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.2s ease-in-out infinite" }} />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", border: "1px dashed var(--border)", borderRadius: 14 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📦</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>No products yet</div>
          <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 300, marginBottom: 24 }}>
            Add your products to use them in website generation
          </div>
          <button onClick={openAdd} style={{
            padding: "10px 24px", background: "var(--accent)", border: "none",
            borderRadius: 8, color: "var(--bg)", fontWeight: 600, fontSize: "0.875rem", cursor: "none",
          }}>
            Add your first product
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(232,213,163,0.2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {/* FIX: dark background + contain so image never gets cropped */}
              <div style={{
                width: "100%",
                minHeight: 180,
                background: "#111113",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: p.image_url ? 8 : 0,
              }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                    📦
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.95rem", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </div>
                {p.description && (
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 300, lineHeight: 1.5, marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {p.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: p.description ? 0 : 12 }}>
                  <button onClick={() => openEdit(p)} style={{
                    flex: 1, padding: "8px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)", borderRadius: 6,
                    color: "var(--muted)", fontSize: "0.78rem", cursor: "none",
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={{
                    padding: "8px 12px", background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6,
                    color: "#f87171", fontSize: "0.78rem", cursor: "none",
                  }}>
                    {deleting === p.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}