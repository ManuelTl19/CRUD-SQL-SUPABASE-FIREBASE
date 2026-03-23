import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = { lastname: "", firstname: "", title: "", city: "" };
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    const { data } = await supabase.from("employees").select("*").order('employeeid');
    setEmployees(data || []);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { data, error } = await supabase.from("employees").update(form).eq("employeeid", form.employeeid).select();
      if (!error) {
        setEmployees(employees.map(emp => emp.employeeid === form.employeeid ? data[0] : emp));
        setIsEditing(false);
        setForm(initialForm);
      }
    } else {
      const { data, error } = await supabase.from("employees").insert([form]).select();
      if (!error) setEmployees([...employees, data[0]]);
      setForm(initialForm);
    }
  };

  return (
    <div>
      <h1>Lista de Empleados</h1>
      <form onSubmit={handleSubmit}>
        <input name="firstname" placeholder="Nombre" value={form.firstname} onChange={e => setForm({...form, firstname: e.target.value})} required />
        <input name="lastname" placeholder="Apellido" value={form.lastname} onChange={e => setForm({...form, lastname: e.target.value})} required />
        <input name="title" placeholder="Puesto" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <button type="submit">{isEditing ? "Actualizar" : "Guardar"}</button>
      </form>
      <table>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employeeid}>
              <td>{emp.firstname} {emp.lastname}</td>
              <td><button onClick={() => {setIsEditing(true); setForm(emp)}}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}