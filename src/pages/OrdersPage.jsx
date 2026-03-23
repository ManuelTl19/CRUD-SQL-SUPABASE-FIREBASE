import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function OrdersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ 
    customerid: "", 
    employeeid: "", 
    shipcity: "", 
    shipname: "" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  // --- LEER (READ) ---
  async function fetchData() {
    setLoading(true);
    const { data: res, error } = await supabase
      .from("orders")
      .select(`
        orderid,
        shipcity,
        shipname,
        customerid,
        employeeid,
        customers ( companyname )
      `)
      .order("orderid", { ascending: false });

    if (error) {
      console.error("Error al obtener pedidos:", error.message);
    } else {
      setData(res || []);
    }
    setLoading(false);
  }

  // --- CREAR O ACTUALIZAR (CREATE / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Lógica de Actualización
      const { error } = await supabase
        .from("orders")
        .update({
          customerid: form.customerid,
          employeeid: parseInt(form.employeeid),
          shipcity: form.shipcity,
          shipname: form.shipname
        })
        .eq("orderid", editingId);

      if (error) alert("Error al actualizar: " + error.message);
      else {
        alert("Pedido actualizado");
        setEditingId(null);
      }
    } else {
      // Lógica de Creación
      const { error } = await supabase
        .from("orders")
        .insert([{
          customerid: form.customerid,
          employeeid: parseInt(form.employeeid),
          shipcity: form.shipcity,
          shipname: form.shipname,
          orderdate: new Date().toISOString()
        }]);

      if (error) alert("Error al crear: " + error.message);
      else alert("Pedido creado");
    }

    setForm({ customerid: "", employeeid: "", shipcity: "", shipname: "" });
    fetchData();
  };

  // --- BORRAR (DELETE) ---
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás segura de eliminar este pedido?")) {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("orderid", id);

      if (error) alert("Error al eliminar: " + error.message);
      else fetchData();
    }
  };

  // Preparar formulario para editar
  const startEdit = (order) => {
    setEditingId(order.orderid);
    setForm({
      customerid: order.customerid || "",
      employeeid: order.employeeid || "",
      shipcity: order.shipcity || "",
      shipname: order.shipname || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ customerid: "", employeeid: "", shipcity: "", shipname: "" });
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ color: "#2c3e50" }}>📦 Panel CRUD de Órdenes (Northwind)</h2>
      
      {/* Formulario */}
      <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #dee2e6" }}>
        <h3>{editingId ? "📝 Editar Orden #" + editingId : "➕ Nueva Orden"}</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input 
            placeholder="ID Cliente (5 carac.)" 
            value={form.customerid} 
            onChange={e => setForm({...form, customerid: e.target.value.toUpperCase()})} 
            maxLength={5}
            required 
            style={{ padding: "8px" }}
          />
          <input 
            placeholder="ID Empleado" 
            type="number" 
            value={form.employeeid} 
            onChange={e => setForm({...form, employeeid: e.target.value})} 
            required 
            style={{ padding: "8px" }}
          />
          <input 
            placeholder="Nombre de Envío" 
            value={form.shipname} 
            onChange={e => setForm({...form, shipname: e.target.value})} 
            style={{ padding: "8px" }}
          />
          <input 
            placeholder="Ciudad" 
            value={form.shipcity} 
            onChange={e => setForm({...form, shipcity: e.target.value})} 
            style={{ padding: "8px" }}
          />
          <button type="submit" style={{ padding: "8px 15px", backgroundColor: editingId ? "#f39c12" : "#27ae60", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            {editingId ? "Actualizar" : "Guardar Pedido"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} type="button" style={{ padding: "8px 15px", backgroundColor: "#95a5a6", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* Tabla de Datos */}
      {loading ? (
        <p>Cargando registros de la base de datos...</p>
      ) : (
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
            <tr>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Cliente</th>
              <th style={{ padding: "12px" }}>Ciudad</th>
              <th style={{ padding: "12px" }}>Nombre Envío</th>
              <th style={{ padding: "12px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(i => (
              <tr key={i.orderid} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{i.orderid}</td>
                <td style={{ padding: "10px" }}>{i.customers?.companyname || i.customerid}</td>
                <td style={{ padding: "10px" }}>{i.shipcity || "N/A"}</td>
                <td style={{ padding: "10px" }}>{i.shipname || "N/A"}</td>
                <td style={{ padding: "10px" }}>
                  <button 
                    onClick={() => startEdit(i)} 
                    style={{ marginRight: "10px", backgroundColor: "#3498db", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "3px" }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(i.orderid)} 
                    style={{ backgroundColor: "#e74c3c", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "3px" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}