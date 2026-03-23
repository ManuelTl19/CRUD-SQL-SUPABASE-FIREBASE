import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const initialForm = {
    categoryname: "",
    description: ""
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order('categoryid', { ascending: true });
    
    if (error) console.log("Error al leer:", error);
    else setCategories(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (category) => {
    setIsEditing(true);
    setForm(category);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      const { data, error } = await supabase
        .from("categories")
        .update({
            categoryname: form.categoryname,
            description: form.description
        })
        .eq("categoryid", form.categoryid)
        .select();

      if (error) {
        alert("Error al actualizar: " + error.message);
      } else {
        setCategories(categories.map(c => c.categoryid === form.categoryid ? data[0] : c));
        alert("Categoría actualizada");
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert([form])
        .select();

      if (error) {
        alert("Error al guardar: " + error.message);
      } else {
        setCategories([...categories, data[0]]);
        setForm(initialForm);
        alert("Categoría agregada");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) return;
    
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("categoryid", id);

    if (error) {
      alert("Error al eliminar (Es posible que tenga productos asociados): " + error.message);
    } else {
      setCategories(categories.filter((c) => c.categoryid !== id));
    }
  };

  return (
    <div>
      <h1>Gestión de Categorías</h1>
      
      <h3>{isEditing ? " Editando Categoría" : "➕ Nueva Categoría"}</h3>

      <form onSubmit={handleSubmit}>
        <input
          name="categoryname"
          placeholder="Nombre de la Categoría"
          value={form.categoryname}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Descripción"
          value={form.description}
          onChange={handleChange}
        />
        
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

      <h2>Lista de Categorías</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.categoryid}>
              <td>{c.categoryid}</td>
              <td>{c.categoryname}</td>
              <td>{c.description}</td>
              <td>
                <button onClick={() => handleEditClick(c)}>Editar</button>
                <button onClick={() => handleDelete(c.categoryid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}