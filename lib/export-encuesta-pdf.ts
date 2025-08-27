import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EncuestaVecinal } from "@/types";

// Sanitiza texto para jsPDF: elimina solo emojis/surrogates no soportados, conserva acentos
function sanitizeForPdf(input: string | undefined | null): string {
  if (!input) return "";
  let s = String(input);
  // Remover pares surrogate (emojis y caracteres fuera del BMP)
  s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
  // Remover surrogates sueltos por seguridad
  s = s.replace(/[\uD800-\uDFFF]/g, "");
  // No normalizar acentos para preservar apariencia
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(new Date(date));
}

export function exportEncuestaToPDF(encuesta: EncuestaVecinal) {
  const doc = new jsPDF();
  // Mejorar legibilidad de texto
  doc.setLineHeightFactor(1.2);
  
  // Configuración de fuentes y colores
  const titleColor: [number, number, number] = [41, 128, 185]; // Azul
  const headerColor: [number, number, number] = [52, 73, 94]; // Gris oscuro
  const textColor: [number, number, number] = [44, 62, 80]; // Gris muy oscuro
  
  // Título principal
  doc.setFontSize(20);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text("ENCUESTA VECINAL - OBRAS PÚBLICAS", 20, 30);
  
  // Línea decorativa
  doc.setDrawColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.setLineWidth(1);
  doc.line(20, 35, 190, 35);
  
  // Información básica
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("INFORMACIÓN GENERAL", 20, 50);
  
  const infoBasica = [
    ["ID de Encuesta:", String(encuesta.id)],
    ["Barrio:", sanitizeForPdf(encuesta.barrio)],
    ["Fecha de Creación:", formatDate(encuesta.fechaCreacion)],
    ["Estado:", sanitizeForPdf(encuesta.estado)],
  ];
  
  autoTable(doc, {
    startY: 55,
    head: [],
    body: infoBasica,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Obras Urgentes
  const currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 70;
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("OBRAS CONSIDERADAS URGENTES", 20, currentY);
  
  const obrasUrgentesData = (encuesta.obrasUrgentes || []).map((obra, index) => [
    `${index + 1}.`,
    sanitizeForPdf(obra)
  ]);
  
  if (encuesta.obrasUrgentesOtro && encuesta.obrasUrgentesOtro.trim()) {
    obrasUrgentesData.push([
      `${obrasUrgentesData.length + 1}.`,
      `Otra: ${sanitizeForPdf(encuesta.obrasUrgentesOtro)}`
    ]);
  }
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [],
    body: obrasUrgentesData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 165 }
    },
    margin: { left: 20, right: 20 }
  });

  // Servicios a Mejorar
  const currentY2 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("SERVICIOS QUE NECESITAN MEJORAR", 20, currentY2);
  
  const serviciosMejorarData = (encuesta.serviciosMejorar || []).map((servicio, index) => [
    `${index + 1}.`,
    sanitizeForPdf(servicio)
  ]);
  
  if (encuesta.serviciosMejorarOtro && encuesta.serviciosMejorarOtro.trim()) {
    serviciosMejorarData.push([
      `${serviciosMejorarData.length + 1}.`,
      `Otro: ${sanitizeForPdf(encuesta.serviciosMejorarOtro)}`
    ]);
  }
  
  autoTable(doc, {
    startY: currentY2 + 5,
    head: [],
    body: serviciosMejorarData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 165 }
    },
    margin: { left: 20, right: 20 }
  });

  // Propuestas y comentarios
  let currentY3 = (doc as any).lastAutoTable.finalY + 15;
  
  if (encuesta.espacioMejorar && encuesta.espacioMejorar.trim()) {
    doc.setFontSize(12);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text("ESPACIO PÚBLICO A MEJORAR", 20, currentY3);
    
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const espacioLines = doc.splitTextToSize(sanitizeForPdf(encuesta.espacioMejorar), 170);
    doc.text(espacioLines, 20, currentY3 + 8);
    currentY3 = currentY3 + 8 + (espacioLines.length * 5) + 10;
  }
  
  if (encuesta.propuesta && encuesta.propuesta.trim()) {
    doc.setFontSize(12);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text("PROPUESTA ADICIONAL", 20, currentY3);
    
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const propuestaLines = doc.splitTextToSize(sanitizeForPdf(encuesta.propuesta), 170);
    doc.text(propuestaLines, 20, currentY3 + 8);
    currentY3 = currentY3 + 8 + (propuestaLines.length * 5) + 10;
  }

  // Información de contacto
  const currentY5 = currentY3;
  
  doc.setFontSize(12);
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.text("INFORMACIÓN DE CONTACTO", 20, currentY5);
  
  const contactoData = [
    ["¿Quiere ser contactado?:", encuesta.quiereContacto ? "Sí" : "No"],
  ];
  
  if (encuesta.quiereContacto) {
    if (encuesta.nombreCompleto && encuesta.nombreCompleto.trim()) {
      contactoData.push(["Nombre Completo:", sanitizeForPdf(encuesta.nombreCompleto)]);
    }
    if (encuesta.telefono && encuesta.telefono.trim()) {
      contactoData.push(["Teléfono:", sanitizeForPdf(encuesta.telefono)]);
    }
    if (encuesta.email && encuesta.email.trim()) {
      contactoData.push(["Email:", sanitizeForPdf(encuesta.email)]);
    }
  }
  
  autoTable(doc, {
    startY: currentY5 + 5,
    head: [],
    body: contactoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: textColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 20 }
  });

  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Municipalidad de Ceres - Encuesta Vecinal de Obras Públicas", 20, pageHeight - 20);
  doc.text(`Generado el: ${formatDate(new Date())}`, 20, pageHeight - 15);
  
  // Guardar el PDF
  doc.save(`encuesta-vecinal-${encuesta.id}.pdf`);
}

// NUEVO: Exportación de estadísticas + encuestas detalladas para un barrio
export function exportEncuestasFiltradasPDF(params: {
  barrio: string;
  stats: {
    totalEncuestas: number;
    obrasUrgentesTop: Array<{ nombre: string; cantidad: number }>;
    serviciosMejorarTop: Array<{ nombre: string; cantidad: number }>;
    participacionContacto?: { quieren: number; noQuieren: number };
    otrosComentarios?: {
      obrasUrgentesOtro?: Array<{ comentario: string; encuestaId: number } | string>;
      serviciosMejorarOtro?: Array<{ comentario: string; encuestaId: number } | string>;
      espaciosYPropuestas?: {
        espacioMejorar?: Array<{ comentario: string; encuestaId: number } | string>;
        propuestas?: Array<{ comentario: string; encuestaId: number } | string>;
      }
    }
  };
  encuestas: EncuestaVecinal[];
}) {
  const { barrio, stats, encuestas } = params;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // Mejorar legibilidad de texto
  doc.setLineHeightFactor(1.2);

  const palette = {
    primary: [41, 128, 185] as [number, number, number],
    header: [52, 73, 94] as [number, number, number],
    text: [44, 62, 80] as [number, number, number],
    muted: [120, 120, 120] as [number, number, number]
  };

  const marginLeft = 40;
  const marginRight = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const textMaxWidth = pageWidth - marginLeft - marginRight;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(...palette.primary);
  doc.text(`Encuestas Vecinales – ${sanitizeForPdf(barrio)}`, marginLeft, 40);
  doc.setDrawColor(...palette.primary);
  doc.setLineWidth(1);
  doc.line(marginLeft, 48, pageWidth - marginRight, 48);

  // Resumen
  doc.setFontSize(12);
  doc.setTextColor(...palette.header);
  doc.text("Resumen", marginLeft, 70);

  const totalObras = stats.obrasUrgentesTop?.reduce((a, b) => a + (b.cantidad || 0), 0) || 0;
  const totalServicios = stats.serviciosMejorarTop?.reduce((a, b) => a + (b.cantidad || 0), 0) || 0;

  autoTable(doc, {
    startY: 80,
    head: [["Métrica", "Valor"]],
    body: [
      ["Barrio", sanitizeForPdf(barrio)],
      ["Total encuestas", String(stats.totalEncuestas || encuestas.length)],
      ["Total votos en Obras", String(totalObras)],
      ["Total votos en Servicios", String(totalServicios)],
      stats.participacionContacto ? ["Dejaron Contacto (Sí / No)", `${stats.participacionContacto.quieren} / ${stats.participacionContacto.noQuieren}`] : undefined,
    ].filter(Boolean) as any,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 6, textColor: palette.text },
    headStyles: { fillColor: palette.primary, textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: textMaxWidth - 200 } },
    margin: { left: marginLeft, right: marginRight }
  });

  // Obras Urgentes Top
  const yAfterResumen = (doc as any).lastAutoTable.finalY + 16;
  doc.setFontSize(12);
  doc.setTextColor(...palette.header);
  doc.text("Obras Urgentes (Top)", marginLeft, yAfterResumen);

  autoTable(doc, {
    startY: yAfterResumen + 8,
    head: [["#", "Obra", "Votos", "%"]],
    body: (stats.obrasUrgentesTop || []).map((item, idx) => [
      String(idx + 1),
      sanitizeForPdf(item.nombre),
      String(item.cantidad || 0),
      totalObras ? `${Math.round((item.cantidad || 0) * 100 / totalObras)}%` : "0%"
    ]),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4, textColor: palette.text, overflow: 'linebreak' },
    headStyles: { fillColor: palette.primary, textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: textMaxWidth - 160 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 70, halign: 'right' } },
    margin: { left: marginLeft, right: marginRight },
    pageBreak: 'auto'
  });

  // Servicios a Mejorar Top
  const yAfterObras = (doc as any).lastAutoTable.finalY + 16;
  doc.setFontSize(12);
  doc.setTextColor(...palette.header);
  doc.text("Servicios a Mejorar (Top)", marginLeft, yAfterObras);

  autoTable(doc, {
    startY: yAfterObras + 8,
    head: [["#", "Servicio", "Votos", "%"]],
    body: (stats.serviciosMejorarTop || []).map((item, idx) => [
      String(idx + 1),
      sanitizeForPdf(item.nombre),
      String(item.cantidad || 0),
      totalServicios ? `${Math.round((item.cantidad || 0) * 100 / totalServicios)}%` : "0%"
    ]),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4, textColor: palette.text, overflow: 'linebreak' },
    headStyles: { fillColor: palette.primary, textColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: textMaxWidth - 160 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 70, halign: 'right' } },
    margin: { left: marginLeft, right: marginRight },
    pageBreak: 'auto'
  });

  // Espacios y Propuestas / Comentarios Otros
  const yAfterServicios = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 24
    : 120;
  doc.setFontSize(12);
  doc.setTextColor(...palette.header);
  doc.text("Espacios y Propuestas / Comentarios", marginLeft, yAfterServicios);

  // Helpers para normalizar comentarios
  const normalizeComentarios = (items?: Array<{ comentario: string; encuestaId?: number } | string>) => {
    const arr = (items || []).map((i: any) => {
      if (typeof i === 'string') return sanitizeForPdf(i)
      const text = sanitizeForPdf(i?.comentario || '')
      const id = i?.encuestaId
      return text ? (id ? `${text} (Encuesta #${id})` : text) : ''
    }).filter(Boolean)
    return arr
  };

  const seccionesComentarios: Array<{ titulo: string; rows: string[] }> = [];
  const espacioRows = normalizeComentarios(stats.otrosComentarios?.espaciosYPropuestas?.espacioMejorar);
  if (espacioRows.length) seccionesComentarios.push({ titulo: 'Espacios a mejorar', rows: espacioRows });
  const propuestaRows = normalizeComentarios(stats.otrosComentarios?.espaciosYPropuestas?.propuestas);
  if (propuestaRows.length) seccionesComentarios.push({ titulo: 'Propuestas adicionales', rows: propuestaRows });
  const otrasObrasRows = normalizeComentarios(stats.otrosComentarios?.obrasUrgentesOtro as any);
  if (otrasObrasRows.length) seccionesComentarios.push({ titulo: 'Otras obras mencionadas', rows: otrasObrasRows });
  const otrosServiciosRows = normalizeComentarios(stats.otrosComentarios?.serviciosMejorarOtro as any);
  if (otrosServiciosRows.length) seccionesComentarios.push({ titulo: 'Otros servicios mencionados', rows: otrosServiciosRows });

  let cursorY = yAfterServicios + 12;

  const ensureSpace = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY + needed > pageHeight - 60) {
      doc.addPage();
      cursorY = 60;
    }
  };

  const drawSubTitle = (title: string) => {
    ensureSpace(20);
    doc.setFontSize(11);
    doc.setTextColor(...palette.primary);
    doc.text(title, marginLeft, cursorY);
    cursorY += 10; // más espacio debajo del subtítulo
  };

  const drawBulletedList = (items: string[]) => {
    doc.setFontSize(10);
    doc.setTextColor(...palette.text);
    const bulletIndent = 12;
    const lineHeight = 14;
    items.forEach((txt) => {
      const safe = sanitizeForPdf(txt);
      const lines = doc.splitTextToSize(safe, textMaxWidth - bulletIndent);
      ensureSpace(lines.length * lineHeight + 4);
      // Dibujar viñeta alineada a la primera línea
      doc.text('•', marginLeft, cursorY);
      // Dibujar líneas del ítem con indent
      doc.text(lines[0], marginLeft + bulletIndent, cursorY);
      for (let i = 1; i < lines.length; i++) {
        cursorY += lineHeight;
        doc.text(lines[i], marginLeft + bulletIndent, cursorY);
      }
      cursorY += lineHeight; // espacio entre ítems
    });
  };

  seccionesComentarios.forEach(sec => {
    drawSubTitle(sanitizeForPdf(sec.titulo));
    drawBulletedList(sec.rows);
  });

  // Sección: Encuestas detalladas
  ensureSpace(40);
  doc.setFontSize(12);
  doc.setTextColor(...palette.header);
  doc.text("Encuestas detalladas", marginLeft, cursorY);
  cursorY += 8;

  (encuestas || []).forEach((encuesta, idx) => {
    ensureSpace(60);
    // Encabezado de encuesta
    doc.setFontSize(11);
    doc.setTextColor(...palette.primary);
    doc.text(`Encuesta #${String(encuesta.id)} – ${formatDate(encuesta.fechaCreacion)}`, marginLeft, cursorY + 16);

    const info = [
      ["Barrio", sanitizeForPdf(encuesta.barrio)],
      ["Estado", sanitizeForPdf(encuesta.estado)],
      ["Obras", sanitizeForPdf((encuesta.obrasUrgentes || []).join(", ")) || "-"],
      ["Obras (Otro)", sanitizeForPdf(encuesta.obrasUrgentesOtro) || "-"],
      ["Servicios", sanitizeForPdf((encuesta.serviciosMejorar || []).join(", ")) || "-"],
      ["Servicios (Otro)", sanitizeForPdf(encuesta.serviciosMejorarOtro) || "-"],
      ["Espacio a mejorar", sanitizeForPdf(encuesta.espacioMejorar) || "-"],
      ["Propuesta", sanitizeForPdf(encuesta.propuesta) || "-"],
      ["Contacto", encuesta.quiereContacto ? "Sí" : "No"],
      ["Nombre", sanitizeForPdf(encuesta.nombreCompleto) || "-"],
      ["Teléfono", sanitizeForPdf(encuesta.telefono) || "-"],
      ["Email", sanitizeForPdf(encuesta.email) || "-"],
    ];

    autoTable(doc, {
      startY: cursorY + 22,
      head: [["Campo", "Detalle"]],
      body: info,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, textColor: palette.text, overflow: 'linebreak' },
      headStyles: { fillColor: palette.primary, textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: textMaxWidth - 140 } },
      margin: { left: marginLeft, right: marginRight },
      pageBreak: 'auto'
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  });

  // Pie
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Municipalidad de Ceres - Encuesta Vecinal de Obras Públicas", marginLeft, pageHeight - 30);
  doc.text(`Generado el: ${formatDate(new Date())}`, marginLeft, pageHeight - 18);

  doc.save(`encuestas-${sanitizeForPdf(barrio)}-${new Date().getTime()}.pdf`);
}