import os
import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image,
)
from reportlab.pdfgen import canvas as pdfcanvas

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "logo_sbj.png")

PRIMARY = colors.HexColor("#6E7B91")
DARK = colors.HexColor("#3F4650")
HOVER = colors.HexColor("#5F6B80")
BORDER = colors.HexColor("#D7DBE1")
ALT_ROW = colors.HexColor("#F4F6F8")
MUTED = colors.HexColor("#8A919C")

FILTER_LABELS = {
    "especialidad": "Especialidad",
    "perfil": "Perfil",
    "criticidad": "Criticidad Clínica",
    "estatus_cirugia": "Estatus de cirugía",
}


class NumberedCanvas(pdfcanvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.setFont("Helvetica", 7.5)
        self.setFillColor(MUTED)
        self.drawRightString(self._pagesize[0] - 16 * mm, 8 * mm, f"Página {self._pageNumber} de {page_count}")


def _format_filters(filt: Optional[dict]) -> str:
    if not filt:
        return "Sin filtros"
    parts = []
    for key, label in FILTER_LABELS.items():
        val = filt.get(key)
        if val not in (None, ""):
            parts.append(f"{label}: {val}")
    return " · ".join(parts) if parts else "Sin filtros"


def _compute_widths(records: list[dict], columns: list[str]) -> list[float]:
    widths = []
    for col in columns:
        longest = len(str(col))
        for record in records:
            val = record.get(col)
            if val is not None:
                longest = max(longest, len(str(val)))
        mm_per_char = 2.2
        width = max(14, min(55, longest * mm_per_char))
        widths.append(width)
    return widths


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
        topMargin=24 * mm,
        bottomMargin=16 * mm,
        title=f"{title} - {institution}",
        author=institution,
    )

    def on_page(canvas, doc_obj):
        canvas.saveState()
        canvas.setFillColor(DARK)
        canvas.rect(0, page[1] - 7 * mm, page[0], 7 * mm, stroke=0, fill=1)

        canvas.setFillColor(colors.HexColor("#EDF0F4"))
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(16 * mm, page[1] - 4.6 * mm, institution)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#C6CCD4"))
        canvas.drawCentredString(page[0] / 2, page[1] - 4.6 * mm, "SISTEMA DE GESTIÓN DE EXPEDIENTES")
        canvas.drawRightString(page[0] - 16 * mm, page[1] - 4.6 * mm, datetime.date.today().strftime("%d/%m/%Y"))

        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.6)
        canvas.line(16 * mm, 12 * mm, page[0] - 16 * mm, 12 * mm)
        canvas.restoreState()

    styles = getSampleStyleSheet()
    cell_style = ParagraphStyle(
        "Cell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#444B54"),
        alignment=TA_LEFT,
    )
    head_style = ParagraphStyle(
        "Head",
        parent=cell_style,
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=1,
    )

    elements = []

    if os.path.exists(LOGO_PATH):
        img = Image(LOGO_PATH, width=30 * mm, height=22.5 * mm)
        img.hAlign = "LEFT"
    else:
        img = Paragraph("", styles["Normal"])

    now = datetime.datetime.now()
    right_cell = [
        Paragraph(
            institution,
            ParagraphStyle("Inst", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=HOVER, leading=14),
        ),
        Paragraph(
            title,
            ParagraphStyle("RepTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=18, textColor=DARK, leading=22, spaceBefore=2),
        ),
        Paragraph(
            f"Generado el {now.strftime('%d/%m/%Y %H:%M')}  ·  Total de registros: {count if count is not None else len(records)}",
            ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9, textColor=MUTED, spaceBefore=6),
        ),
    ]

    header_table = Table([[img, right_cell]], colWidths=[34 * mm, None])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 3 * mm))

    sep = Table([[""]], colWidths=[page[0] - 32 * mm], rowHeights=[1.6])
    sep.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PRIMARY)]))
    elements.append(sep)
    elements.append(Spacer(1, 4 * mm))

    filter_text = _format_filters(filters)
    if filter_text != "Sin filtros":
        filt_row = Table(
            [[Paragraph(f"<b>Filtros aplicados:</b> {filter_text}", cell_style)]],
            colWidths=[page[0] - 32 * mm],
        )
        filt_row.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ALT_ROW),
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(filt_row)
        elements.append(Spacer(1, 4 * mm))

    table_data = [[Paragraph(c, head_style) for c in columns]]
    for record in records:
        row = []
        for col in columns:
            val = record.get(col)
            if val is None or str(val).strip() == "":
                val = "-"
            row.append(Paragraph(str(val), cell_style))
        table_data.append(row)

    widths = _compute_widths(records, columns)
    total_width = sum(widths)
    max_width = page[0] - 32 * mm
    if total_width > max_width:
        scale = max_width / total_width
        widths = [max(14, w * scale) for w in widths]

    table = Table(table_data, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ALT_ROW]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(table)

    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page, canvasmaker=NumberedCanvas)
