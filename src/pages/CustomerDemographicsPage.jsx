import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function CustomerDemographicsPage() {
  const [demos, setDemos] = useState([]);
  const [form, setForm] = useState({ customertypeid: "", customerdesc: "" });

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from("customer_demographics").select("*");
      setDemos(data || []);
    }
    fetch();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await supabase.from("customer_demographics").insert([form]);
    setDemos([...demos, form]);
    setForm({ customertypeid: "", customerdesc: "" });
  };

  return (
    <div>
      <h1>Demografía de Clientes</h1>
      <form onSubmit={save}>
        <input placeholder="ID Tipo" value={form.customertypeid} onChange={e => setForm({...form, customertypeid: e.target.value})} />
        <textarea placeholder="Descripción" value={form.customerdesc} onChange={e => setForm({...form, customerdesc: e.target.value})} />
        <button type="submit">Guardar</button>
      </form>
      {demos.map(d => <p key={d.customertypeid}><b>{d.customertypeid}:</b> {d.customerdesc}</p>)}
    </div>
  );
}