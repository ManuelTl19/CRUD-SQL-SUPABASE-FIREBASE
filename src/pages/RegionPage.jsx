import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function RegionPage() {
  const [regions, setRegions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = { regionid: "", regiondescription: "" };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchRegions(); }, []);

  async function fetchRegions() {
    const { data, error } = await supabase.from("region").select("*").order('regionid');
    if (!error) setRegions(data);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { data, error } = await supabase.from("region").update(form).eq("regionid", form.regionid).select();
      if (!error) {
        setRegions(regions.map(r => r.regionid === form.regionid ? data[0] : r));
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      const { data, error } = await supabase.from("region").insert([form]).select();
      if (!error) setRegions([...regions, data[0]]);
      setForm(initialForm);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar región?")) return;
    const { error } = await supabase.from("region").delete().eq("regionid", id);
    if (!error) setRegions(regions.filter(r => r.regionid !== id));
  };

  return (
    <div>
      <h1>Gestión de Regiones</h1>
      <form onSubmit={handleSubmit}>
        <input name="regionid" placeholder="ID (Número)" value={form.regionid} onChange={(e) => setForm({...form, regionid: e.target.value})} disabled={isEditing} required />
        <input name="regiondescription" placeholder="Descripción" value={form.regiondescription} onChange={(e) => setForm({...form, regiondescription: e.target.value})} required />
        <button type="submit">{isEditing ? "Actualizar" : "Guardar"}</button>
      </form>
      <table>
        <tbody>
          {regions.map(r => (
            <tr key={r.regionid}>
              <td>{r.regionid}</td>
              <td>{r.regiondescription}</td>
              <td>
                <button onClick={() => {setIsEditing(true); setForm(r)}}>Editar</button>
                <button onClick={() => handleDelete(r.regionid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}