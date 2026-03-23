import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function EmployeeTerritoriesPage() {
  const [data, setData] = useState([]);
  const initialForm = { employeeid: "", territoryid: "" };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data, error } = await supabase.from("employee_territories").select("*");
    if (!error) setData(data);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("employee_territories").insert([form]);
    if (!error) {
      setData([...data, form]);
      setForm(initialForm);
    }
  };

  return (
    <div>
      <h1>Empleados por Territorio</h1>
      <form onSubmit={handleSubmit}>
        <input name="employeeid" placeholder="Emp ID" value={form.employeeid} onChange={(e) => setForm({...form, employeeid: e.target.value})} required />
        <input name="territoryid" placeholder="Territory ID" value={form.territoryid} onChange={(e) => setForm({...form, territoryid: e.target.value})} required />
        <button type="submit">Asignar</button>
      </form>
      <ul>
        {data.map((item, i) => (
          <li key={i}>Empleado {item.employeeid} en Territorio {item.territoryid}</li>
        ))}
      </ul>
    </div>
  );
}