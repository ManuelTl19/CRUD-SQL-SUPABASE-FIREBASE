const PDFDocument = require("pdfkit");

function toText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function toMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return toText(value, "N/A");
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function drawKeyValueLine(doc, x, y, width, label, value, options = {}) {
  const labelFontSize = options.labelFontSize || 8;
  const valueFontSize = options.valueFontSize || 8;
  const valueColor = options.valueColor || "#111827";
  const labelColor = options.labelColor || "#4b5563";

  doc.font("Helvetica").fontSize(labelFontSize).fillColor(labelColor);
  doc.text(label, x, y, {
    width: Math.floor(width * 0.58),
    align: "left",
    lineBreak: false,
  });

  doc.font(options.boldValue ? "Helvetica-Bold" : "Helvetica").fontSize(valueFontSize).fillColor(valueColor);
  doc.text(value, x, y, {
    width,
    align: "right",
    lineBreak: false,
  });
}

function drawOrderConfirmationLayout(doc, options) {
  const order = options?.order || {};
  const items = Array.isArray(options?.items) ? options.items : [];
  const totals = Array.isArray(options?.totals) ? options.totals : [];
  const cardX = 22;
  const cardY = 24;
  const cardW = 256;
  const cardH = 744;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4e1aa");

  doc.roundedRect(cardX, cardY, cardW, cardH, 18).fill("#ffffff");

  let y = cardY + 16;
  const contentX = cardX + 12;
  const contentW = cardW - 24;

  doc.font("Helvetica").fontSize(13).fillColor("#111827").text("<", contentX, y + 1, {
    width: 10,
    lineBreak: false,
  });

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(
    toText(options?.title, "Tu pedido ha sido confirmado"),
    contentX,
    y + 34,
    { width: contentW * 0.58, align: "left" }
  );

  const buttonW = 94;
  const buttonH = 28;
  const buttonX = cardX + cardW - buttonW - 12;
  const buttonY = y + 26;
  doc.roundedRect(buttonX, buttonY, buttonW, buttonH, 8).fill("#f6b02d");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827").text(
    toText(options?.ctaLabel, "Rastrear pedido"),
    buttonX,
    buttonY + 9,
    { width: buttonW, align: "center", lineBreak: false }
  );

  y += 76;

  doc.font("Helvetica").fontSize(10).fillColor("#1f2937").text(
    `Hola, ${toText(options?.recipientName, "Cliente")}.`,
    contentX,
    y,
    { width: contentW }
  );
  y += 22;

  doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(
    toText(options?.message, "Tu pedido fue confirmado y sera enviado pronto."),
    contentX,
    y,
    { width: contentW }
  );
  y += 35;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Detalle del pedido", contentX, y, {
    width: contentW,
  });
  y += 20;

  if (items.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("No hay productos en este pedido", contentX, y, {
      width: contentW,
    });
    y += 20;
  } else {
    items.slice(0, 4).forEach((item, index) => {
      const rowTop = y;

      doc.circle(contentX + 8, rowTop + 12, 9).strokeColor("#d1d5db").lineWidth(1).stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827").text(
        toText(item.name, `Producto ${index + 1}`),
        contentX + 22,
        rowTop,
        { width: contentW - 70, ellipsis: true }
      );
      doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(
        `Cantidad: ${toText(item.qty, "0")}`,
        contentX + 22,
        rowTop + 12,
        { width: contentW - 70 }
      );
      doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(
        `Precio unitario: $${toText(item.price, "0.00")}`,
        contentX + 22,
        rowTop + 22,
        { width: contentW - 70 }
      );

      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827").text(
        `$${toText(item.total, "0.00")}`,
        contentX,
        rowTop + 11,
        { width: contentW, align: "right", lineBreak: false }
      );

      y += 40;
      doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor("#e5e7eb").lineWidth(1).stroke();
      y += 8;
    });
  }

  const orderDetails = [
    ["Nombre del receptor:", toText(order.receiverName, "N/A")],
    ["ID de pedido:", toText(order.orderCode, "N/A")],
    ["Fecha del pedido:", formatDate(order.orderDate)],
    ["Direccion de envio:", toText(order.shippingAddress, "N/A")],
  ];

  orderDetails.forEach(([label, value]) => {
    doc.font("Helvetica").fontSize(8.2).fillColor("#1f2937").text(`${label} ${value}`, contentX, y, {
      width: contentW,
    });
    y += 16;
  });

  y += 2;
  doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor("#e5e7eb").lineWidth(1).stroke();
  y += 10;

  totals.forEach((entry) => {
    drawKeyValueLine(
      doc,
      contentX,
      y,
      contentW,
      `${toText(entry.label, "Total")}:`,
      `$${toText(entry.value, "0.00")}`,
      {
        boldValue: Boolean(entry.bold),
        valueColor: entry.negative ? "#dc2626" : "#111827",
      }
    );
    y += 17;
  });

  y += 2;
  doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor("#e5e7eb").lineWidth(1).stroke();
  y += 10;

  doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(
    toText(options?.policyText, "Puedes cancelar tu pedido dentro del plazo permitido. Aplican politicas de cancelacion."),
    contentX,
    y,
    { width: contentW }
  );
  y += 26;

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text(
    toText(options?.footerThanks, "Gracias por tu compra."),
    contentX,
    y,
    { width: contentW }
  );

  doc.roundedRect(cardX + (cardW - 84) / 2, cardY + cardH - 10, 84, 3, 2).fill("#111827");
}

function drawSupplierInvoiceLayout(doc, options) {
  const invoice = options?.invoice || {};
  const items = Array.isArray(options?.items) ? options.items : [];
  const totals = Array.isArray(options?.totals) ? options.totals : [];
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const fullW = right - left;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4f7fb");

  doc
    .rect(0, 0, doc.page.width, 130)
    .fill("#0ea5a8");

  doc
    .circle(doc.page.width * 0.65, 140, 210)
    .fill("#ffffff");

  doc
    .circle(doc.page.width * 0.98, doc.page.height - 50, 220)
    .fill("#0ea5a8");

  doc
    .circle(doc.page.width * 0.94, doc.page.height - 40, 170)
    .fill("#14b8a6");

  doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff").text(
    toText(options?.title, "SOLICITUD DE COMPRA"),
    left,
    38,
    { width: fullW * 0.45 }
  );

  doc.font("Helvetica-Bold").fontSize(26).fillColor("#0f172a").text(
    toText(options?.brandName, "Northwind"),
    right - fullW * 0.42,
    30,
    { width: fullW * 0.42, align: "right" }
  );
  doc.font("Helvetica").fontSize(12).fillColor("#334155").text(
    toText(options?.brandSubtitle, "Abastecimiento"),
    right - fullW * 0.42,
    62,
    { width: fullW * 0.42, align: "right" }
  );

  let y = 150;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Proveedor", left, y);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(
    toText(invoice.supplierName, "N/A"),
    left,
    y + 16,
    { width: fullW * 0.5 }
  );
  doc.text(`Contacto: ${toText(invoice.contactName, "N/A")}`, left, y + 32, {
    width: fullW * 0.5,
  });

  const metaX = right - fullW * 0.36;
  const metaW = fullW * 0.36;
  drawKeyValueLine(doc, metaX, y, metaW, "Folio", toText(invoice.folio, "N/A"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 15, metaW, "Fecha", formatDate(invoice.requestDate), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 30, metaW, "Solicita", toText(invoice.requesterName, "Compras"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 45, metaW, "Area", toText(invoice.requesterArea, "Area de Compras"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 60, metaW, "Fecha requerida", toText(invoice.neededDate, "No especificada"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });

  y += 96;

  const colDesc = left + 8;
  const colQty = left + fullW * 0.62;
  const colPrice = left + fullW * 0.76;
  const colTotal = left + fullW * 0.88;

  doc.roundedRect(left, y, fullW, 24, 4).fill("#0f9da0");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
  doc.text("DESCRIPCION", colDesc, y + 7, { width: fullW * 0.55, lineBreak: false });
  doc.text("CANT.", colQty, y + 7, { width: fullW * 0.12, align: "right", lineBreak: false });
  doc.text("P. UNIT", colPrice, y + 7, { width: fullW * 0.1, align: "right", lineBreak: false });
  doc.text("TOTAL", colTotal, y + 7, { width: fullW * 0.1, align: "right", lineBreak: false });
  y += 28;

  const tableBottomLimit = doc.page.height - 190;
  const safeItems = items.length > 0
    ? items
    : [{ name: "Sin productos", qty: "0", price: "0.00", total: "0.00" }];

  safeItems.forEach((item, index) => {
    if (y > tableBottomLimit) {
      return;
    }

    const desc = toText(item.name, `Producto ${index + 1}`);
    doc.font("Helvetica").fontSize(9).fillColor("#111827").text(desc, colDesc, y, {
      width: fullW * 0.55,
      ellipsis: true,
      lineBreak: false,
    });
    doc.text(String(toText(item.qty, "0")), colQty, y, {
      width: fullW * 0.12,
      align: "right",
      lineBreak: false,
    });
    doc.text(`$${toText(item.price, "0.00")}`, colPrice, y, {
      width: fullW * 0.1,
      align: "right",
      lineBreak: false,
    });
    doc.text(`$${toText(item.total, "0.00")}`, colTotal, y, {
      width: fullW * 0.1,
      align: "right",
      lineBreak: false,
    });

    y += 18;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#cfe7ea").lineWidth(1).stroke();
    y += 5;
  });

  y += 8;
  totals.forEach((entry) => {
    if (y > doc.page.height - 120) {
      return;
    }

    drawKeyValueLine(doc, right - 220, y, 220, `${toText(entry.label, "Total")}:`, `$${toText(entry.value, "0.00")}`, {
      labelFontSize: entry.bold ? 10 : 9,
      valueFontSize: entry.bold ? 11 : 9,
      boldValue: Boolean(entry.bold),
      valueColor: entry.negative ? "#dc2626" : entry.bold ? "#0f9da0" : "#0f172a",
    });
    y += 18;
  });

  if (invoice.notes) {
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(
      `Descripcion general: ${invoice.notes}`,
      left,
      doc.page.height - 118,
      { width: fullW * 0.7 }
    );
  }

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff").text(
    toText(options?.footerThanks, "Gracias por hacer negocios con nosotros."),
    left,
    doc.page.height - 34,
    { width: fullW * 0.55 }
  );

  doc.font("Helvetica").fontSize(9).fillColor("#e6fffb").text(
    toText(options?.footerCompany, "Northwind"),
    right - fullW * 0.36,
    doc.page.height - 54,
    { width: fullW * 0.36, align: "right" }
  );
}

function drawSaleNoteInvoiceLayout(doc, options) {
  const invoice = options?.invoice || {};
  const items = Array.isArray(options?.items) ? options.items : [];
  const totals = Array.isArray(options?.totals) ? options.totals : [];
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const fullW = right - left;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4f7fb");
  doc.rect(0, 0, doc.page.width, 130).fill("#0f9da0");
  doc.circle(doc.page.width * 0.65, 140, 210).fill("#ffffff");
  doc.circle(doc.page.width * 0.98, doc.page.height - 50, 220).fill("#0f9da0");
  doc.circle(doc.page.width * 0.94, doc.page.height - 40, 170).fill("#14b8a6");

  doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff").text(
    toText(options?.title, "NOTA DE VENTA"),
    left,
    38,
    { width: fullW * 0.45 }
  );

  doc.font("Helvetica-Bold").fontSize(26).fillColor("#0f172a").text(
    toText(options?.brandName, "Northwind"),
    right - fullW * 0.42,
    30,
    { width: fullW * 0.42, align: "right" }
  );
  doc.font("Helvetica").fontSize(12).fillColor("#334155").text(
    toText(options?.brandSubtitle, "Punto de Venta"),
    right - fullW * 0.42,
    62,
    { width: fullW * 0.42, align: "right" }
  );

  let y = 150;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Cliente", left, y);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(
    toText(invoice.customerName, "N/A"),
    left,
    y + 16,
    { width: fullW * 0.5 }
  );
  doc.text(`Vendedor: ${toText(invoice.sellerName, "N/A")}`, left, y + 32, {
    width: fullW * 0.5,
  });
  doc.text(`Direccion de envio: ${toText(invoice.shippingAddress, "N/A")}`, left, y + 48, {
    width: fullW * 0.5,
  });

  const metaX = right - fullW * 0.36;
  const metaW = fullW * 0.36;
  drawKeyValueLine(doc, metaX, y, metaW, "Folio", toText(invoice.orderCode, "N/A"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 15, metaW, "Fecha", formatDate(invoice.requestDate), {
    labelFontSize: 9,
    valueFontSize: 9,
  });
  drawKeyValueLine(doc, metaX, y + 30, metaW, "Estado", toText(invoice.status, "vendido"), {
    labelFontSize: 9,
    valueFontSize: 9,
  });

  y += 96;

  const colDesc = left + 8;
  const colQty = left + fullW * 0.62;
  const colPrice = left + fullW * 0.76;
  const colTotal = left + fullW * 0.88;

  doc.roundedRect(left, y, fullW, 24, 4).fill("#0f9da0");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
  doc.text("DESCRIPCION", colDesc, y + 7, { width: fullW * 0.55, lineBreak: false });
  doc.text("CANT.", colQty, y + 7, { width: fullW * 0.12, align: "right", lineBreak: false });
  doc.text("P. UNIT", colPrice, y + 7, { width: fullW * 0.1, align: "right", lineBreak: false });
  doc.text("TOTAL", colTotal, y + 7, { width: fullW * 0.1, align: "right", lineBreak: false });
  y += 28;

  const tableBottomLimit = doc.page.height - 190;
  const safeItems = items.length > 0
    ? items
    : [{ name: "Sin productos", qty: "0", price: "0.00", total: "0.00" }];

  safeItems.forEach((item, index) => {
    if (y > tableBottomLimit) {
      return;
    }

    const desc = toText(item.name, `Producto ${index + 1}`);
    doc.font("Helvetica").fontSize(9).fillColor("#111827").text(desc, colDesc, y, {
      width: fullW * 0.55,
      ellipsis: true,
      lineBreak: false,
    });
    doc.text(String(toText(item.qty, "0")), colQty, y, {
      width: fullW * 0.12,
      align: "right",
      lineBreak: false,
    });
    doc.text(`$${toText(item.price, "0.00")}`, colPrice, y, {
      width: fullW * 0.1,
      align: "right",
      lineBreak: false,
    });
    doc.text(`$${toText(item.total, "0.00")}`, colTotal, y, {
      width: fullW * 0.1,
      align: "right",
      lineBreak: false,
    });

    y += 18;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#cfe7ea").lineWidth(1).stroke();
    y += 5;
  });

  y += 8;
  totals.forEach((entry) => {
    if (y > doc.page.height - 120) {
      return;
    }

    drawKeyValueLine(doc, right - 220, y, 220, `${toText(entry.label, "Total")}:`, `$${toText(entry.value, "0.00")}`, {
      labelFontSize: entry.bold ? 10 : 9,
      valueFontSize: entry.bold ? 11 : 9,
      boldValue: Boolean(entry.bold),
      valueColor: entry.negative ? "#dc2626" : entry.bold ? "#0f9da0" : "#0f172a",
    });
    y += 18;
  });

  if (options?.invoiceNotes) {
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(
      `Notas: ${toText(options.invoiceNotes, "")}`,
      left,
      doc.page.height - 118,
      { width: fullW * 0.7 }
    );
  }

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff").text(
    toText(options?.footerThanks, "Gracias por su compra."),
    left,
    doc.page.height - 34,
    { width: fullW * 0.55 }
  );

  doc.font("Helvetica").fontSize(9).fillColor("#e6fffb").text(
    toText(options?.footerCompany, "Northwind"),
    right - fullW * 0.36,
    doc.page.height - 54,
    { width: fullW * 0.36, align: "right" }
  );
}

function createTicketPdf(options) {
  const title = options?.title || "DOCUMENTO";
  const subtitle = options?.subtitle || "Sistema Northwind";
  const meta = Array.isArray(options?.meta) ? options.meta : [];
  const items = Array.isArray(options?.items) ? options.items : [];
  const totals = Array.isArray(options?.totals) ? options.totals : [];
  const footer = Array.isArray(options?.footer) ? options.footer : [];

  const isLargeInvoice = options?.layout === "supplier-invoice" || options?.layout === "sale-note-invoice";
  const doc = new PDFDocument({
    size: isLargeInvoice ? "A4" : [300, 792],
    margin: isLargeInvoice ? 36 : 20,
  });

  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    if (options?.layout === "order-confirmation") {
      drawOrderConfirmationLayout(doc, options);
      doc.end();
      return;
    }

    if (options?.layout === "supplier-invoice") {
      drawSupplierInvoiceLayout(doc, options);
      doc.end();
      return;
    }

    if (options?.layout === "sale-note-invoice") {
      drawSaleNoteInvoiceLayout(doc, options);
      doc.end();
      return;
    }

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