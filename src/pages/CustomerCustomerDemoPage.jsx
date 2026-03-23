import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function CustomerCustomerDemoPage() {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ customerid: "", customertypeid: "" });

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    const { data } = await supabase.from("customer_customer_demo").select("*");
    setLinks(data || []);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("customer_customer_demo").insert([form]);
    if (!error) {
      setLinks([...links, form]);
      setForm({ customerid: "", customertypeid: "" });
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h1>Asignación de Demografía</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="ID Cliente" value={form.customerid} onChange={e => setForm({...form, customerid: e.target.value})} required />
        <input placeholder="ID Tipo Demografía" value={form.customertypeid} onChange={e => setForm({...form, customertypeid: e.target.value})} required />
        <button type="submit">Vincular</button>
      </form>
      <ul>
        {links.map((item, i) => (
          <li key={i}>Cliente {item.customerid} es tipo {item.customertypeid}</li>
        ))}
      </ul>
    </div>
  );
}