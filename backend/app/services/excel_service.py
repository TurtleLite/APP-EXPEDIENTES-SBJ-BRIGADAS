import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.list_definition import ListDefinition, ListRecord

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

PRIMARY = "B07A40"
DARK = "7C5636"
BORDER = "E5C9A8"
ALT_ROW = "FFFBEB"
MUTED = "9C9C9C"

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


def _content_widths(columns: List[str], records: List[dict], max_w: int = 40, min_w: int = 10) -> List[int]:
    widths = []
    for col in columns:
        longest = len(str(col))
        for record in records:
            val = record.get(col)
            if val is not None:
                longest = max(longest, len(str(val)))
        widths.append(max(min_w, min(max_w, longest + 4)))
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
    last_col = get_column_letter(ncols)
    now = datetime.datetime.now()

    ws.sheet_view.showGridLines = False

    header_row = 1
    if title:
        header_row = 5

        ws.merge_cells(f"A1:{last_col}1")
        c = ws.cell(row=1, column=1, value=institution)
        c.font = Font(name="Calibri", bold=True, size=16, color=DARK)
        c.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[1].height = 28

        ws.merge_cells(f"A2:{last_col}2")
        c = ws.cell(row=2, column=1, value=title)
        c.font = Font(name="Calibri", bold=True, size=13, color=PRIMARY)
        c.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[2].height = 22

        ws.merge_cells(f"A3:{last_col}3")
        meta = (
            f"Generado el {now.strftime('%d/%m/%Y %H:%M')}  ·  "
            f"Total de registros: {count if count is not None else len(records)}  ·  "
            f"Filtros: {_format_filters(filters)}"
        )
        c = ws.cell(row=3, column=1, value=meta)
        c.font = Font(name="Calibri", size=10, italic=True, color=MUTED)
        c.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[3].height = 18

        ws.row_dimensions[4].height = 6

    for col_idx, col_name in enumerate(columns, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=col_name)
        cell.fill = PatternFill(start_color=PRIMARY, end_color=PRIMARY, fill_type="solid")
        cell.font = Font(color="FFFFFF", bold=True, size=11)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = _thin_border()
    ws.row_dimensions[header_row].height = 26

    for row_idx, record in enumerate(records, header_row + 1):
        for col_idx, col_name in enumerate(columns, 1):
            val = record.get(col_name, "")
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.border = _thin_border()
            cell.font = Font(name="Calibri", size=10)
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            if (row_idx - header_row) % 2 == 0:
                cell.fill = PatternFill(start_color=ALT_ROW, end_color=ALT_ROW, fill_type="solid")

    widths = _content_widths(columns, records)
    for col_idx, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(col_idx)].width = w

    ws.auto_filter.ref = f"{get_column_letter(1)}{header_row}:{last_col}{header_row + len(records)}"
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    ws.page_setup.paperSize = 9  # A4
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_margins.left = 0.4
    ws.page_margins.right = 0.4
    ws.page_margins.top = 0.7
    ws.page_margins.bottom = 0.7

    ws.oddHeader.center.text = institution
    ws.oddHeader.center.size = 9
    ws.oddHeader.center.color = DARK
    ws.oddHeader.center.font = "Calibri"

    ws.oddFooter.left.text = f"Generado el {now.strftime('%d/%m/%Y')}"
    ws.oddFooter.left.size = 8
    ws.oddFooter.left.color = MUTED
    ws.oddFooter.right.text = "Página &P de &N"
    ws.oddFooter.right.size = 8
    ws.oddFooter.right.color = MUTED

    wb.save(filepath)
