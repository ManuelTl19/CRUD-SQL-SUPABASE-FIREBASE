import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = {
    customerid: "",
    companyname: "",
    contactname: "",
    contacttitle: "",
    address: "",
    city: "",
    region: "",
    postalcode: "",
    country: "",
    phone: "",
    fax: "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order('customerid', { ascending: true });
    
    if (error) console.log("Error al leer:", error);
    else setCustomers(data);
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (customer) => {
    setIsEditing(true);
    setForm(customer);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      const { data, error } = await supabase
        .from("customers")
        .update(form)
        .eq("customerid", form.customerid)
        .select();

      if (error) {
        alert("Error al actualizar: " + error.message);
      } else {
        setCustomers(customers.map(c => c.customerid === form.customerid ? data[0] : c));
        alert("¡Cliente actualizado correctamente!");
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      if (form.customerid.length > 5) {
        alert("El CustomerID no puede tener más de 5 caracteres");
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .insert([form])
        .select();

      if (error) {
        alert("Error al guardar: " + error.message);
      } else {
        setCustomers([...customers, data[0]]);
        setForm(initialForm);
        alert("¡Cliente agregado correctamente!");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;
    
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("customerid", id);

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      setCustomers(customers.filter((c) => c.customerid !== id));
    }
  };

  return (
    <div>
      <h1>Gestión de Clientes (Northwind)</h1>
      
      <h3>{isEditing ? " Editando Cliente" : "➕ Agregar Nuevo Cliente"}</h3>

      <form onSubmit={handleSubmit}>
        <input
          name="customerid"
          placeholder="CustomerID"
          value={form.customerid}
          onChange={handleChange}
          required
          maxLength={5}
          disabled={isEditing}
        />
        <input
          name="companyname"
          placeholder="Nombre de la Empresa"
          value={form.companyname}
          onChange={handleChange}
          required
        />
        <input
          name="contactname"
          placeholder="Nombre de Contacto"
          value={form.contactname}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Dirección"
          value={form.address}
          onChange={handleChange}
        />
        
        <div>
          <button type="submit">
            {isEditing ? "Actualizar Cambios" : "Guardar Cliente"}
          </button>

          {isEditing && (
            <button type="button" onClick={() => { setIsEditing(false); setForm(initialForm); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h2>Lista de Clientes</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Empresa</th>
            <th>Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customerid}>
              <td>{c.customerid}</td>
              <td>{c.companyname}</td>
              <td>{c.contactname}</td>
              <td>
                <button onClick={() => handleEditClick(c)}>Editar</button>
                <button onClick={() => handleDelete(c.customerid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}