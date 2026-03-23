import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const initialForm = {
    companyname: "",
    contactname: "",
    contacttitle: "",
    address: "",
    city: "",
    phone: "",
    homepage: ""
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order('supplierid', { ascending: true });
    
    if (error) console.log("Error:", error);
    else setSuppliers(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (sup) => {
    setIsEditing(true);
    setForm(sup);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      const { data, error } = await supabase
        .from("suppliers")
        .update(form)
        .eq("supplierid", form.supplierid)
        .select();

      if (error) alert(error.message);
      else {
        setSuppliers(suppliers.map(s => s.supplierid === form.supplierid ? data[0] : s));
        setIsEditing(false);
        setForm(initialForm);
        alert("Proveedor actualizado");
      }
    } else {
      const { data, error } = await supabase.from("suppliers").insert([form]).select();
      if (error) alert(error.message);
      else {
        setSuppliers([...suppliers, data[0]]);
        setForm(initialForm);
        alert("Proveedor guardado");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar proveedor?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("supplierid", id);
    if (error) alert(error.message);
    else setSuppliers(suppliers.filter((s) => s.supplierid !== id));
  };

  return (
    <div>
      <h1>Gestión de Proveedores</h1>
      
      <h3>{isEditing ? "📍 Editando Proveedor" : "➕ Nuevo Proveedor"}</h3>

      <form onSubmit={handleSubmit}>
        <input name="companyname" placeholder="Empresa" value={form.companyname} onChange={handleChange} required />
        <input name="contactname" placeholder="Contacto" value={form.contactname} onChange={handleChange} />
        <input name="contacttitle" placeholder="Título" value={form.contacttitle} onChange={handleChange} />
        <input name="address" placeholder="Dirección" value={form.address} onChange={handleChange} />
        <input name="city" placeholder="Ciudad" value={form.city} onChange={handleChange} />
        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />
        <input name="homepage" placeholder="Sitio Web" value={form.homepage} onChange={handleChange} />

        <div>
          <button type="submit">{isEditing ? "Actualizar" : "Guardar"}</button>
          {isEditing && <button type="button" onClick={() => { setIsEditing(false); setForm(initialForm); }}>Cancelar</button>}
        </div>
      </form>

      <h2>Lista de Proveedores</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Empresa</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.supplierid}>
              <td>{s.supplierid}</td>
              <td>{s.companyname}</td>
              <td>{s.contactname}</td>
              <td>{s.phone}</td>
              <td>
                <button onClick={() => handleEditClick(s)}>Editar</button>
                <button onClick={() => handleDelete(s.supplierid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}