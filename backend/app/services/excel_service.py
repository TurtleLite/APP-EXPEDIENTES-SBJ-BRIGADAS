import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.list_definition import ListDefinition, ListRecord


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


def export_to_excel(records: list[dict], columns: list[str], filepath: str):
    wb = openpyxl.Workbook()
    ws = wb.active

    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11)
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    for col_idx, col_name in enumerate(columns, 1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        cell.border = thin_border

    for row_idx, record in enumerate(records, 2):
        for col_idx, col_name in enumerate(columns, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=record.get(col_name, ""))
            cell.border = thin_border

    for col_idx in range(1, len(columns) + 1):
        ws.column_dimensions[get_column_letter(col_idx)].width = max(12, len(str(columns[col_idx - 1])) + 4)

    wb.save(filepath)
