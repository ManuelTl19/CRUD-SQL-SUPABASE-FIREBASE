import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function ShippersPage() {
  const [shippers, setShippers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = { companyname: "", phone: "" };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchShippers(); }, []);

  async function fetchShippers() {
    const { data, error } = await supabase.from("shippers").select("*").order('shipperid');
    if (!error) setShippers(data);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { data, error } = await supabase.from("shippers").update(form).eq("shipperid", form.shipperid).select();
      if (!error) {
        setShippers(shippers.map(s => s.shipperid === form.shipperid ? data[0] : s));
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      const { data, error } = await supabase.from("shippers").insert([form]).select();
      if (!error) setShippers([...shippers, data[0]]);
      setForm(initialForm);
    }
  };

  return (
    <div>
      <h1>Transportistas</h1>
      <form onSubmit={handleSubmit}>
        <input name="companyname" placeholder="Empresa" value={form.companyname} onChange={(e) => setForm({...form, companyname: e.target.value})} required />
        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
        <button type="submit">{isEditing ? "Actualizar" : "Guardar"}</button>
      </form>
      <table>
        <tbody>
          {shippers.map(s => (
            <tr key={s.shipperid}>
              <td>{s.companyname}</td>
              <td><button onClick={() => {setIsEditing(true); setForm(s)}}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}