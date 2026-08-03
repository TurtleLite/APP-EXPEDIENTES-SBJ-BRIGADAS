import datetime
import math
import os
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.list_definition import ListDefinition, ListRecord

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.properties import PageSetupProperties

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "logo_sbj.png")

PRIMARY = "6E7B91"
DARK = "3F4650"
BORDER = "D7DBE1"
ALT_ROW = "F4F6F8"
MUTED = "8A919C"

FILTER_LABELS = {
    "especialidad": "Especialidad",
    "perfil": "Perfil",
    "criticidad": "Criticidad Clínica",
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


def _thin_border(color: str = BORDER):
    side = Side(style="thin", color=color)
    return Border(left=side, right=side, top=side, bottom=side)


KNOWN_WIDTHS = {
    "No": 4.0,
    "Nombre/Name": 32.81,
    "Age": 5.3,
    "Diagnostic/Procedure": 22.0,
    "Pf": 4.43,
    "Origin": 17.86,
    "Phone NO.": 11.57,
    "Housing": 8.1,
    "Chart": 8.72,
    "Referred by": 15.86,
}


def _content_widths(records: List[dict], columns: List[str]) -> List[int]:
    widths = []
    for col in columns:
        if col in KNOWN_WIDTHS:
            widths.append(KNOWN_WIDTHS[col])
            continue
        lens = [len(str(rec.get(col, ""))) for rec in records] or [0]
        header = min(len(str(col)), 8)
        longest = max(lens)
        eff = max(header, longest)
        widths.append(min(26, max(4, eff + 2)))
    return widths


def import_records_from_excel(db: Session, list_id: int, filepath: str) -> int:
    wb = openpyxl.load_workbook(filepath)
    ws = wb.active

    ld = db.query(ListDefinition).filter(ListDefinition.id == list_id).first()
    if not ld:
        raise ValueError("Lista no encontrada")

    headers = [cell.value for cell in ws[1]]
    col_keys = [c["key"] for c in ld.columns_config]
    col_map = {}
    for i, header in enumerate(headers):
        for key in col_keys:
            if header and header.lower() == key.lower():
                col_map[i] = key
                break

    count = 0
    for row in ws.iter_rows(min_row=2, values_only=False):
        data = {}
        for i, cell in enumerate(row):
            if cell.value is not None and i in col_map:
                data[col_map[i]] = cell.value
        if data:
            record = ListRecord(list_definition_id=list_id, data=data)
            db.add(record)
            count += 1

    db.commit()
    return count


def export_to_excel(
    records: List[dict],
    columns: List[str],
    filepath: str,
    title: Optional[str] = None,
    filters: Optional[dict] = None,
    count: Optional[int] = None,
    institution: str = "Centro Médico San Benito José",
):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Reporte"

    ncols = len(columns)
    data_col0 = 2 if title else 1
    last_col = get_column_letter(ncols + (1 if title else 0))
    now = datetime.datetime.now()

    ws.sheet_view.showGridLines = False

    row = 1
    if title:
        ws.column_dimensions["A"].width = 3
        if os.path.exists(LOGO_PATH):
            logo = XLImage(LOGO_PATH)
            logo.width = 130
            logo.height = 96
            ws.add_image(logo, "A1")

        ws.merge_cells(f"B{row}:{last_col}{row}")
        c = ws.cell(row=row, column=2, value=institution.upper())
        c.font = Font(bold=True, size=10, color=DARK)
        c.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[row].height = 34
        row += 1

        ws.merge_cells(f"B{row}:{last_col}{row}")
        c = ws.cell(row=row, column=2, value=title)
        c.font = Font(bold=True, size=15, color=PRIMARY)
        c.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[row].height = 34
        row += 1

        ws.merge_cells(f"B{row}:{last_col}{row}")
        c = ws.cell(
            row=row,
            column=2,
            value=f"Generado el {now.strftime('%d/%m/%Y')} a las {now.strftime('%H:%M')}   |   Total de registros: {count if count is not None else len(records)}",
        )
        c.font = Font(size=8, italic=True, color=MUTED)
        c.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[row].height = 20
        row += 1

        ws.row_dimensions[row].height = 2
        row += 1  # spacer

        ws.merge_cells(f"B{row}:{last_col}{row}")
        line = ws.cell(row=row, column=2)
        line.fill = PatternFill(start_color=BORDER, end_color=BORDER, fill_type="solid")
        ws.row_dimensions[row].height = 1.5
        row += 1

        ws.row_dimensions[row].height = 3
        row += 1  # spacer

        filter_text = _format_filters(filters)
        if filter_text != "Sin filtros":
            ws.merge_cells(f"B{row}:{last_col}{row}")
            c = ws.cell(row=row, column=2)
            from openpyxl.cell.rich_text import CellRichText, TextBlock
            from openpyxl.cell.text import InlineFont
            c.value = CellRichText(
                TextBlock(InlineFont(b=True, sz=8, color=DARK), f"Filtros aplicados:  "),
                TextBlock(InlineFont(sz=8, color=MUTED), filter_text),
            )
            c.fill = PatternFill(start_color=ALT_ROW, end_color=ALT_ROW, fill_type="solid")
            c.alignment = Alignment(horizontal="left", vertical="center")
            c.border = _thin_border()
            ws.row_dimensions[row].height = 13
            row += 1
            ws.row_dimensions[row].height = 4
            row += 1  # spacer

    header_row = row

    widths = _content_widths(records, columns)
    total_cols = len(widths) + (1 if title else 0)
    col_a_units = 3 if title else 0
    target_units = ((11.0 - 0.8) * 96 - 3 * total_cols) / 7.0
    factor = (target_units - col_a_units) / (sum(widths) or 1)
    widths = [round(w * factor, 2) for w in widths]
    if title:
        missing = target_units - col_a_units - sum(widths)
        if missing > 0.5 and widths:
            base = sum(widths)
            widths = [round(w + missing * w / base, 2) for w in widths]
    for i, w in enumerate(widths, data_col0):
        ws.column_dimensions[get_column_letter(i)].width = w

    for col_idx, col_name in enumerate(columns, 1):
        col = col_idx + (1 if title else 0)
        cell = ws.cell(row=header_row, column=col, value=col_name)
        cell.fill = PatternFill(start_color=PRIMARY, end_color=PRIMARY, fill_type="solid")
        cell.font = Font(color="FFFFFF", bold=True, size=10)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        side_bottom = Side(style="medium", color="3F4650")
        side_thin = Side(style="thin", color=BORDER)
        cell.border = Border(left=side_thin, right=side_thin, top=side_thin, bottom=side_bottom)
    ws.row_dimensions[header_row].height = 17

    for data_idx, record in enumerate(records, header_row + 1):
        max_lines = 1
        for col_idx, col_name in enumerate(columns, 1):
            col = col_idx + (1 if title else 0)
            val = record.get(col_name, "")
            cell = ws.cell(row=data_idx, column=col, value=val)
            cell.border = _thin_border()
            cell.font = Font(size=10, color="444B54")
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            if (data_idx - header_row) % 2 == 0:
                cell.fill = PatternFill(start_color=ALT_ROW, end_color=ALT_ROW, fill_type="solid")
            lines = math.ceil((len(str(val)) + 1) / max(1.0, widths[col_idx - 1] - 1))
            max_lines = max(max_lines, lines)
        ws.row_dimensions[data_idx].height = 15 if max_lines == 1 else 15 + (max_lines - 1) * 13.5

    first_col = get_column_letter(data_col0)
    ws.auto_filter.ref = f"{first_col}{header_row}:{last_col}{header_row + len(records)}"
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.print_options.horizontalCentered = True
    ws.page_setup.paperSize = 1  # Carta (Letter) 8.5" x 11"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_margins.left = 0.4
    ws.page_margins.right = 0.4
    ws.page_margins.top = 0.7
    ws.page_margins.bottom = 0.7

    ws.print_title_rows = f"{header_row}:{header_row}"

    ws.oddFooter.left.text = f"Generado el {now.strftime('%d/%m/%Y')}"
    ws.oddFooter.left.size = 8
    ws.oddFooter.left.color = MUTED
    ws.oddFooter.right.text = "Página &P de &N"
    ws.oddFooter.right.size = 8
    ws.oddFooter.right.color = MUTED

    wb.save(filepath)
