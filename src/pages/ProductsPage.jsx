import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = {
    productname: "",
    supplierid: null, // Northwind usa IDs numéricos aquí
    categoryid: null, // Northwind usa IDs numéricos aquí
    quantityperunit: "",
    unitprice: 0,
    unitsinstock: 0,
    discontinued: false
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order('productid', { ascending: true });
    if (error) console.log(error);
    else setProducts(data);
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setForm(product);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { data, error } = await supabase
        .from("products")
        .update(form)
        .eq("productid", form.productid)
        .select();
      
      if (error) {
        alert("Error al actualizar: " + error.message);
      } else {
        setProducts(products.map(p => p.productid === form.productid ? data[0] : p));
        setIsEditing(false);
        setForm(initialForm);
        alert("Producto actualizado");
      }
    } else {
      const { data, error } = await supabase.from("products").insert([form]).select();
      if (error) {
        alert("Error al guardar: " + error.message);
      } else {
        setProducts([...products, data[0]]);
        setForm(initialForm);
        alert("Producto guardado");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("products").delete().eq("productid", id);
    if (error) alert(error.message);
    else setProducts(products.filter((p) => p.productid !== id));
  };

  return (
    <div>
      <h1>Gestión de Productos</h1>
      
      <h3>{isEditing ? "📍 Editando Producto" : "➕ Nuevo Producto"}</h3>

      <form onSubmit={handleSubmit}>
        <input name="productname" placeholder="Nombre del Producto" value={form.productname} onChange={handleChange} required />
        <input name="unitprice" type="number" step="0.01" placeholder="Precio" value={form.unitprice} onChange={handleChange} />
        <input name="unitsinstock" type="number" placeholder="Stock" value={form.unitsinstock} onChange={handleChange} />
        
        <label>
          <input name="discontinued" type="checkbox" checked={form.discontinued} onChange={handleChange} />
          Discontinuado
        </label>

        <div>
          <button type="submit">
            {isEditing ? "Actualizar" : "Guardar"}
          </button>
          {isEditing && (
            <button type="button" onClick={() => { setIsEditing(false); setForm(initialForm); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productid}>
              <td>{p.productid}</td>
              <td>{p.productname}</td>
              <td>{p.unitprice}</td>
              <td>{p.unitsinstock}</td>
              <td>
                <button onClick={() => handleEditClick(p)}>Editar</button>
                <button onClick={() => handleDelete(p.productid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}