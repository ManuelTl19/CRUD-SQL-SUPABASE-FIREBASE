const PDFDocument = require("pdfkit");

function createTicketPdf(options) {
  const title = options?.title || "DOCUMENTO";
  const subtitle = options?.subtitle || "Sistema Northwind";
  const meta = Array.isArray(options?.meta) ? options.meta : [];
  const items = Array.isArray(options?.items) ? options.items : [];
  const totals = Array.isArray(options?.totals) ? options.totals : [];
  const footer = Array.isArray(options?.footer) ? options.footer : [];

  const doc = new PDFDocument({
    size: [300, 792],
    margin: 20,
  });

  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // TITULO
    doc.fontSize(14).text(title, { align: "left" });
    doc.fontSize(10).text(subtitle);
    doc.moveDown();

    // META INFO
    meta.forEach((entry) => {
      doc.fontSize(9).text(`${entry.label}: ${entry.value}`);
    });

    doc.moveDown();
    doc.text("DETALLE", { underline: true });
    doc.moveDown(0.5);

    // PRODUCTOS
    if (items.length === 0) {
      doc.text("Sin conceptos");
    } else {
      items.forEach((item) => {
        doc.fontSize(9).text(
          `${item.name}  x${item.qty}  $${item.price}  =  $${item.total}`
        );
      });
    }

    doc.moveDown();

    // TOTALES
    totals.forEach((entry) => {
      doc.fontSize(entry.bold ? 11 : 9).text(`${entry.label}: ${entry.value}`);
    });

    doc.moveDown();

    // FOOTER
    footer.forEach((line) => {
      doc.fontSize(8).text(line);
    });

    doc.end();
  });
}

async function createPdfBuffer(lines) {
  const ticketItems = (lines || []).slice(1).map((line) => ({
    name: String(line || ""),
    qty: "",
    price: "",
    total: "",
  }));

  return await createTicketPdf({
    title: lines?.[0] || "DOCUMENTO",
    subtitle: "Formato Ticket",
    items: ticketItems,
  });
}

module.exports = {
  createPdfBuffer,
  createTicketPdf,
};