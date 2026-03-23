import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = { territoryid: "", territorydescription: "", regionid: "" };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchTerritories(); }, []);

  async function fetchTerritories() {
    const { data, error } = await supabase.from("territories").select("*").order('territoryid');
    if (!error) setTerritories(data);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { data, error } = await supabase.from("territories").update(form).eq("territoryid", form.territoryid).select();
      if (!error) {
        setTerritories(territories.map(t => t.territoryid === form.territoryid ? data[0] : t));
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      const { data, error } = await supabase.from("territories").insert([form]).select();
      if (!error) setTerritories([...territories, data[0]]);
      setForm(initialForm);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar territorio?")) return;
    const { error } = await supabase.from("territories").delete().eq("territoryid", id);
    if (!error) setTerritories(territories.filter(t => t.territoryid !== id));
  };

  return (
    <div>
      <h1>Gestión de Territorios</h1>
      <form onSubmit={handleSubmit}>
        <input name="territoryid" placeholder="ID (Texto)" value={form.territoryid} onChange={(e) => setForm({...form, territoryid: e.target.value})} disabled={isEditing} required />
        <input name="territorydescription" placeholder="Descripción" value={form.territorydescription} onChange={(e) => setForm({...form, territorydescription: e.target.value})} required />
        <input name="regionid" placeholder="Region ID (Número)" value={form.regionid} onChange={(e) => setForm({...form, regionid: e.target.value})} required />
        <button type="submit">{isEditing ? "Actualizar" : "Guardar"}</button>
      </form>
      <table>
        <tbody>
          {territories.map(t => (
            <tr key={t.territoryid}>
              <td>{t.territoryid}</td>
              <td>{t.territorydescription}</td>
              <td>
                <button onClick={() => {setIsEditing(true); setForm(t)}}>Editar</button>
                <button onClick={() => handleDelete(t.territoryid)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}