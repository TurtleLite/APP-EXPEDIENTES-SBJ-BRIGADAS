import os
import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "logo_sbj.png")

TEAL = colors.HexColor("#0d9488")
DARK_TEAL = colors.HexColor("#134e4a")
BORDER_COLOR = colors.HexColor("#a9ded6")
ROW_ALT = colors.HexColor("#f0fdfa")

FILTER_LABELS = {
    "especialidad": "Especialidad",
    "perfil": "Perfil",
    "estatus_cirugia": "Estatus de cirugía",
}


def _format_filters(filt: Optional[dict]) -> str:
    if not filt:
        return "Sin filtros"
    parts = []
    for key, label in FILTER_LABELS.items():
        val = filt.get(key)
        if val not in (None, ""):
            parts.append(f"{label}: {val}")
    return " · ".join(parts) if parts else "Sin filtros"


def export_to_pdf(
    records: list[dict],
    columns: list[str],
    title: str,
    filepath: str,
    filters: Optional[dict] = None,
    count: Optional[int] = None,
    institution: str = "Centro Médico San Benito José",
):
    page = landscape(letter)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=page,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=22 * mm,
        bottomMargin=16 * mm,
    )

    def on_page(canvas, doc_obj):
        canvas.saveState()
        canvas.setFillColor(TEAL)
        canvas.rect(0, page[1] - 5 * mm, page[0], 5 * mm, stroke=0, fill=1)
        canvas.setFillColor(DARK_TEAL)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(16 * mm, 8 * mm, institution)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#4f6d6a"))
        canvas.drawCentredString(page[0] / 2, 8 * mm, f"Generado el {datetime.date.today().strftime('%d/%m/%Y')}")
        canvas.drawRightString(page[0] - 16 * mm, 8 * mm, f"Página {doc_obj.page}")
        canvas.restoreState()

    styles = getSampleStyleSheet()
    elements = []

    if os.path.exists(LOGO_PATH):
        img = Image(LOGO_PATH, width=38 * mm, height=38 * mm)
        img.hAlign = "LEFT"
    else:
        img = Paragraph("", styles["Normal"])

    right_cell = [
        Paragraph(
            institution,
            ParagraphStyle("Inst", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=15, textColor=DARK_TEAL),
        ),
        Paragraph(
            title,
            ParagraphStyle("RepTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=17, textColor=TEAL, spaceBefore=3),
        ),
        Paragraph(
            f"Total de registros: {count if count is not None else len(records)}",
            ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9.5, textColor=colors.HexColor("#4f6d6a"), spaceBefore=8),
        ),
        Paragraph(
            f"Filtros aplicados: {_format_filters(filters)}",
            ParagraphStyle("Meta2", parent=styles["Normal"], fontSize=8.5, textColor=colors.HexColor("#6e9290"), spaceBefore=2),
        ),
    ]

    header_table = Table([[img, right_cell]], colWidths=[42 * mm, None])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4 * mm))

    sep = Table([[""]], colWidths=[page[0] - 32 * mm], rowHeights=[1.2])
    sep.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), TEAL)]))
    elements.append(sep)
    elements.append(Spacer(1, 5 * mm))

    table_data = [columns]
    for record in records:
        row = []
        for col in columns:
            val = record.get(col)
            if val is None or str(val).strip() == "":
                val = "-"
            row.append(str(val))
        table_data.append(row)

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ROW_ALT]),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(table)

    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
