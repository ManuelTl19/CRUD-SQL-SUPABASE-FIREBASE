import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { generateNotaVentaPDF, generatePurchasePDF } from "../utils/generatePurchasePDF";

export default function OrderDetailsPage() {
  const [details, setDetails] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [shippingCost, setShippingCost] = useState(81.91); // El costo de tu imagen

  const initialForm = { orderid: "", productid: "", unitprice: 0, quantity: 1, discount: 0 };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchDetails(); }, []);

  async function fetchDetails() {
    const { data, error } = await supabase
      .from("order_details")
      .select(`
        *,
        products ( 
          productname,
          suppliers ( companyname, contactname )
        )
      `)
      .limit(50);
    
    if (error) console.log("Error:", error);
    else setDetails(data || []);
  }

  const toggleSelection = (orderid, productid) => {
    const key = `${orderid}-${productid}`;
    setSelectedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSelectedTotal = () => {
    return details
      .filter(d => selectedItems[`${d.orderid}-${d.productid}`])
      .reduce((acc, d) => acc + (d.quantity * d.unitprice * (1 - (d.discount || 0))), 0);
  };

  // --- FUNCIÓN 1: IMPRIMIR NOTA DE VENTA ---
  const handlePrintNotaVenta = () => {
    const selected = details.filter(d => selectedItems[`${d.orderid}-${d.productid}`]);
    if (selected.length === 0) return alert("Selecciona productos.");

    const subtotal = calculateSelectedTotal();
    const first = selected[0];

    generateNotaVentaPDF({
      cliente: "HILARION-Abastos", // Puedes traer esto de una relación con Customers
      vendedor: "Margaret Peacock",
      direccion: "Carrera 22 con Ave. Carlos Soublette #8-35, San Cristóbal",
      folio: `NV-${first.orderid}`,
      fecha: new Date().toLocaleDateString(),
      estado: "vendido",
      items: selected.map(i => [i.products?.productname, i.quantity, `$${i.unitprice}`, `$${(i.quantity * i.unitprice).toFixed(2)}`]),
      subtotal: subtotal.toFixed(2),
      envio: shippingCost.toFixed(2),
      total: (subtotal + shippingCost).toFixed(2)
    });
  };

  // --- FUNCIÓN 2: IMPRIMIR SOLICITUD DE COMPRA ---
  const handlePrintPurchase = () => {
    const selected = details.filter(d => selectedItems[`${d.orderid}-${d.productid}`]);
    if (selected.length === 0) return alert("Selecciona productos.");

    const total = calculateSelectedTotal();
    const first = selected[0];

    generatePurchasePDF({
      proveedor: first.products?.suppliers?.companyname || "Proveedor",
      contacto: first.products?.suppliers?.contactname || "N/A",
      folio: `SC-2-${first.orderid}`,
      fecha: new Date().toLocaleDateString(),
      items: selected.map(i => ({
        descripcion: i.products?.productname,
        cantidad: i.quantity,
        precio: i.unitprice,
        total: (i.quantity * i.unitprice).toFixed(2)
      })),
      total: total.toFixed(2)
    });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isEditing ? 
      supabase.from("order_details").update(form).eq("orderid", form.orderid).eq("productid", form.productid) :
      supabase.from("order_details").insert([form]);

    const { error } = await action;
    if (error) alert("Error: " + error.message);
    else { fetchDetails(); setForm(initialForm); setIsEditing(false); alert("Éxito"); }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Gestión de Ventas y Detalles</h1>
      
      {/* Panel de Control de PDFs */}
      <div style={{ background: '#2c3e50', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Total Seleccionado: ${calculateSelectedTotal().toFixed(2)}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrintNotaVenta} style={{ backgroundColor: '#27ae60', color: 'white', padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
              📄 Generar NOTA DE VENTA
            </button>
            <button onClick={handlePrintPurchase} style={{ backgroundColor: '#e67e22', color: 'white', padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
              📦 Generar SOLICITUD COMPRA
            </button>
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Costo Envío (Para Nota Venta): </label>
          <input type="number" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value))} style={{ width: '80px' }} />
        </div>
      </div>

      {/* Tu Formulario CRUD Original */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        <input name="orderid" placeholder="ID Pedido" value={form.orderid} onChange={handleChange} disabled={isEditing} />
        <input name="productid" placeholder="ID Prod." value={form.productid} onChange={handleChange} disabled={isEditing} />
        <input name="unitprice" type="number" placeholder="Precio" value={form.unitprice} onChange={handleChange} />
        <input name="quantity" type="number" placeholder="Cant" value={form.quantity} onChange={handleChange} />
        <button type="submit" style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 15px' }}>
          {isEditing ? "Actualizar" : "Guardar"}
        </button>
      </form>

      {/* Tu Tabla Original */}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th>Sel.</th>
            <th>Pedido</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cant.</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d) => {
            const isSelected = !!selectedItems[`${d.orderid}-${d.productid}`];
            return (
              <tr key={`${d.orderid}-${d.productid}`} style={{ backgroundColor: isSelected ? '#fff9c4' : 'transparent' }}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(d.orderid, d.productid)} />
                </td>
                <td>{d.orderid}</td>
                <td>{d.products?.productname}</td>
                <td>${parseFloat(d.unitprice).toFixed(2)}</td>
                <td>{d.quantity}</td>
                <td>${(d.quantity * d.unitprice).toFixed(2)}</td>
                <td><button onClick={() => { setIsEditing(true); setForm(d); }}>Editar</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}