import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- DISEÑO: NOTA DE VENTA (Azul / Gris) ---
export const generateNotaVentaPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80); 
  doc.text("NOTA DE VENTA", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente", 14, 35);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente, 14, 42);
  doc.text(`Vendedor: ${data.vendedor}`, 14, 48);
  doc.text(`Dirección: ${data.direccion}`, 14, 54, { maxWidth: 90 });

  doc.text(`Folio: ${data.folio}`, 140, 42);
  doc.text(`Fecha: ${data.fecha}`, 140, 48);
  doc.text(`Estado: ${data.estado}`, 140, 54);

  autoTable(doc, {
    startY: 65,
    head: [["DESCRIPCIÓN", "CANT.", "P. UNIT", "TOTAL"]],
    body: data.items,
    theme: "striped",
    headStyles: { fillColor: [44, 62, 80] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal productos: $${data.subtotal}`, 130, finalY);
  doc.text(`Costo de envío: $${data.envio}`, 130, finalY + 7);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${data.total}`, 130, finalY + 15);
  doc.save(`${data.folio}.pdf`);
};

// --- DISEÑO: SOLICITUD DE COMPRA (Gris / Negro) ---
export const generatePurchasePDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("SOLICITUD DE COMPRA", 14, 20);
  doc.setFontSize(10);
  doc.text("Northwind - Abastecimiento", 14, 28);

  doc.text(`Proveedor: ${data.proveedor}`, 14, 40);
  doc.text(`Contacto: ${data.contacto}`, 14, 46);
  doc.text(`Folio: ${data.folio}`, 140, 40);
  doc.text(`Fecha: ${data.fecha}`, 140, 46);

  autoTable(doc, {
    startY: 55,
    head: [["DESCRIPCION", "CANT.", "P. UNIT", "TOTAL"]],
    body: data.items.map(i => [i.descripcion, i.cantidad, `$${i.precio}`, `$${i.total}`]),
    theme: "grid",
    headStyles: { fillColor: [80, 80, 80] }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Total solicitado: $${data.total}`, 140, finalY);
  doc.save(`Solicitud_${data.folio}.pdf`);
};