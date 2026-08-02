import os
import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas as pdfcanvas

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "logo_sbj.png")

PRIMARY = colors.HexColor("#6E7B91")
DARK = colors.HexColor("#3F4650")
BORDER = colors.HexColor("#D7DBE1")
ALT_ROW = colors.HexColor("#F4F6F8")
MUTED = colors.HexColor("#8A919C")
BODY_TEXT = colors.HexColor("#444B54")

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


def _compute_widths(records: list[dict], columns: list[str], usable_mm: float) -> list[float]:
    raw = []
    for col in columns:
        lens = [len(str(rec.get(col, ""))) for rec in records] or [0]
        header = len(str(col))
        longest = max(lens)
        avg = sum(lens) / len(lens)
        w = max(header, min(longest, round(avg * 1.4 + 4)))
        raw.append(max(12, min(45, w * 2.0)))
    total = sum(raw)
    if total > usable_mm:
        raw = [max(12, w * usable_mm / total) for w in raw]
    return raw


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
    inst_style = ParagraphStyle(
        "Inst", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=12, textColor=DARK, leading=15,
    )
    title_style = ParagraphStyle(
        "RepTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=16, textColor=PRIMARY,
        leading=19, spaceBefore=2,
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=9, textColor=MUTED,
        leading=11, spaceBefore=5,
    )
    cell_style = ParagraphStyle(
        "Cell", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=12,
        textColor=BODY_TEXT, alignment=TA_LEFT,
    )
    head_style = ParagraphStyle(
        "Head", parent=cell_style, fontName="Helvetica-Bold", fontSize=10, leading=12,
        textColor=colors.white, alignment=TA_CENTER,
    )
    filt_style = ParagraphStyle(
        "Filt", parent=cell_style, fontSize=9, leading=11, textColor=DARK,
    )

    elements = []

    if os.path.exists(LOGO_PATH):
        img = Image(LOGO_PATH, width=22 * mm, height=16.5 * mm)
        img.hAlign = "LEFT"
    else:
        img = Paragraph("", styles["Normal"])

    now = datetime.datetime.now()
    right_cell = [
        Paragraph(institution, inst_style),
        Paragraph(title, title_style),
        Paragraph(
            f"Generado el {now.strftime('%d/%m/%Y %H:%M')}  ·  Total de registros: {count if count is not None else len(records)}",
            meta_style,
        ),
    ]

    header_table = Table([[img, right_cell]], colWidths=[24 * mm, None])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4 * mm))

    sep = Table([[""]], colWidths=[page[0] - 32 * mm], rowHeights=[1.6])
    sep.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PRIMARY)]))
    elements.append(sep)
    elements.append(Spacer(1, 4 * mm))

    filter_text = _format_filters(filters)
    if filter_text != "Sin filtros":
        filt_row = Table(
            [[Paragraph(f"Filtros aplicados: {filter_text}", filt_style)]],
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

    widths = _compute_widths(records, columns, page[0] - 32 * mm)
    total_width = sum(widths)

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
