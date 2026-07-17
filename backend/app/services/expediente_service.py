from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, NamedStyle
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session
from app.models.list_definition import ListDefinition, ListRecord
from app.schemas.list_definition import ListDefinitionCreate
from app.services.list_service import create_list_definition


EXPEDIENTE_COLUMNS = [
    {"key": "centro_medico", "label": "Centro Médico", "type": "text"},
    {"key": "especialidad", "label": "Especialidad", "type": "text"},
    {"key": "criticidad", "label": "Criticidad Clínica", "type": "text"},
    {"key": "estatus", "label": "Estatus del Paciente", "type": "text"},
    {"key": "nombre", "label": "Nombre/First Name", "type": "text"},
    {"key": "apellido", "label": "Apellido/Last Name", "type": "text"},
    {"key": "sexo", "label": "Sexo/Sex", "type": "text"},
    {"key": "edad", "label": "Age/Edad", "type": "number"},
    {"key": "fecha_elaboracion", "label": "Fecha de Elaboración", "type": "date"},
    {"key": "identidad", "label": "Nº Identidad", "type": "text"},
    {"key": "persona_responsable", "label": "Persona Responsable", "type": "text"},
    {"key": "procedencia", "label": "Procedencia", "type": "text"},
    {"key": "albergue", "label": "Albergue", "type": "text"},
    {"key": "perfil", "label": "Perfil", "type": "text"},
    {"key": "telefono", "label": "Teléfono", "type": "text"},
    {"key": "domicilio", "label": "Domicilio del Paciente", "type": "text"},
    {"key": "historia_enfermedad", "label": "Historia de Enfermedad Actual", "type": "text"},
    {"key": "enfermedades_previas", "label": "Enfermedades Anteriores", "type": "text"},
    {"key": "cirugias_previas", "label": "Cirugías Anteriores", "type": "text"},
    {"key": "alergias", "label": "Alergias", "type": "text"},
    {"key": "otros_antecedentes", "label": "Otros Antecedentes", "type": "text"},
    {"key": "presion_arterial", "label": "P.A./B.P", "type": "text"},
    {"key": "fc", "label": "F.C.", "type": "text"},
    {"key": "pulso", "label": "Pulso", "type": "text"},
    {"key": "temperatura", "label": "T°", "type": "text"},
    {"key": "fr", "label": "F.R.", "type": "text"},
    {"key": "peso", "label": "Peso/Weight", "type": "text"},
    {"key": "talla", "label": "Talla", "type": "text"},
    {"key": "bmi", "label": "B.M.I.", "type": "text"},
    {"key": "examen_fisico", "label": "Examen Físico", "type": "text"},
    {"key": "diagnostico", "label": "Diagnóstico", "type": "text"},
    {"key": "nombre_medico", "label": "Nombre del Médico", "type": "text"},
    {"key": "cirujano", "label": "Cirujano", "type": "text"},
    {"key": "fecha_cirugia", "label": "Fecha de Cirugía", "type": "date"},
]


def create_expediente_template(db: Session, user_id: int) -> ListDefinition:
    schema = ListDefinitionCreate(
        name="Expediente Médico",
        description="Historial clínico de pacientes con datos personales, antecedentes, signos vitales y diagnóstico",
        columns_config=EXPEDIENTE_COLUMNS,
    )
    return create_list_definition(db, schema, user_id)


def export_expediente_excel(records: list[ListRecord], filepath: str):
    wb = Workbook()
    ws = wb.active
    ws.title = "Expediente"

    thin = Side(style='thin')
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11)
    label_fill = PatternFill(start_color="D6E4F0", end_color="D6E4F0", fill_type="solid")
    label_font = Font(bold=True, size=10)
    normal_font = Font(size=10)
    title_font = Font(bold=True, size=14)
    section_font = Font(bold=True, size=11, color="1F4E79")
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_wrap = Alignment(horizontal="left", vertical="top", wrap_text=True)

    for row_idx, record in enumerate(records):
        d = record.data if record.data else {}

        if row_idx > 0:
            ws.append([])
            start_row = ws.max_row + 1
        else:
            start_row = 1

        r = start_row

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        cell = ws.cell(r, 1, d.get("centro_medico", "Centro Médico"))
        cell.font = title_font
        cell.alignment = center
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=4)
        ws.cell(r, 1, "Especialidad").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=6)
        ws.cell(r, 5, d.get("especialidad", "")).font = normal_font
        ws.cell(r, 5).border = border
        ws.cell(r, 5).alignment = center
        ws.cell(r, 7, "Criticidad clínica").font = label_font
        ws.cell(r, 7).fill = label_fill
        ws.cell(r, 7).border = border
        ws.cell(r, 8, d.get("criticidad", "")).font = normal_font
        ws.cell(r, 8).border = border
        ws.cell(r, 8).alignment = center
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Nombre/First Name").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
        ws.cell(r, 3, d.get("nombre", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=6)
        ws.cell(r, 5, "Apellido/Last Name").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=8)
        ws.cell(r, 7, d.get("apellido", "")).font = normal_font
        ws.cell(r, 7).border = border
        ws.cell(r, 7).alignment = center
        r += 1

        ws.cell(r, 1, "Sexo/Sex").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("sexo", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 3, "Age/Edad").font = label_font
        ws.cell(r, 3).fill = label_fill
        ws.cell(r, 3).border = border
        ws.cell(r, 4, str(d.get("edad", ""))).font = normal_font
        ws.cell(r, 4).border = border
        ws.cell(r, 4).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=8)
        ws.cell(r, 5, "Fecha de Elaboración (d/m/a)").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.cell(r, 6, str(d.get("fecha_elaboracion", ""))).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Nº Identidad").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
        ws.cell(r, 3, d.get("identidad", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=6)
        ws.cell(r, 5, "Persona Responsable").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=8)
        ws.cell(r, 7, d.get("persona_responsable", "")).font = normal_font
        ws.cell(r, 7).border = border
        ws.cell(r, 7).alignment = center
        r += 1

        ws.cell(r, 1, "Procedencia").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
        ws.cell(r, 2, d.get("procedencia", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 5, "Perfil").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.cell(r, 6, d.get("perfil", "")).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        ws.cell(r, 7, "Teléfono").font = label_font
        ws.cell(r, 7).fill = label_fill
        ws.cell(r, 7).border = border
        ws.cell(r, 8, d.get("telefono", "")).font = normal_font
        ws.cell(r, 8).border = border
        ws.cell(r, 8).alignment = center
        r += 1

        ws.cell(r, 1, "Albergue").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
        ws.cell(r, 2, d.get("albergue", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 5, "Estatus de paciente").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.merge_cells(start_row=r, start_column=6, end_row=r, end_column=8)
        ws.cell(r, 6, d.get("estatus", "")).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Domicilio del Paciente").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("domicilio", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = left_wrap
        r += 1

        r2 = r + 4
        ws.merge_cells(start_row=r, start_column=1, end_row=r2, end_column=8)
        ws.cell(r, 1, "History of Present Illness/Historia de Enfermedad Actual").font = section_font
        ws.cell(r, 1).fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("historia_enfermedad", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = left_wrap
        r = r2 + 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, "Medical History/Antecedentes").font = section_font
        ws.cell(r, 1).fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
        ws.cell(r, 1).border = border
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Previous illness / Enfermedades anteriores").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("enfermedades_previas", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = left_wrap
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Past surgeries / Cirugías anteriores").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("cirugias_previas", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = left_wrap
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Allergies/Alergias").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("alergias", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = left_wrap
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Other/Otros Antecedentes").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("otros_antecedentes", "")).font = normal_font
        ws.cell(r, 3).border = border
        ws.cell(r, 3).alignment = left_wrap
        r += 1

        ws.cell(r, 1, "P.A./B.P").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("presion_arterial", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 3, "F.C.").font = label_font
        ws.cell(r, 3).fill = label_fill
        ws.cell(r, 3).border = border
        ws.cell(r, 4, d.get("fc", "")).font = normal_font
        ws.cell(r, 4).border = border
        ws.cell(r, 4).alignment = center
        ws.cell(r, 5, "Pulso").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.cell(r, 6, d.get("pulso", "")).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        ws.cell(r, 7, "T°").font = label_font
        ws.cell(r, 7).fill = label_fill
        ws.cell(r, 7).border = border
        ws.cell(r, 8, d.get("temperatura", "")).font = normal_font
        ws.cell(r, 8).border = border
        ws.cell(r, 8).alignment = center
        r += 1

        ws.cell(r, 1, "F.R.").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("fr", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 3, "Peso/Weight").font = label_font
        ws.cell(r, 3).fill = label_fill
        ws.cell(r, 3).border = border
        ws.cell(r, 4, d.get("peso", "")).font = normal_font
        ws.cell(r, 4).border = border
        ws.cell(r, 4).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=6)
        ws.cell(r, 5, "Talla").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.cell(r, 6, d.get("talla", "")).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=8)
        ws.cell(r, 7, "B.M.I.").font = label_font
        ws.cell(r, 7).fill = label_fill
        ws.cell(r, 7).border = border
        ws.cell(r, 8, d.get("bmi", "")).font = normal_font
        ws.cell(r, 8).border = border
        ws.cell(r, 8).alignment = center
        r += 1

        r2 = r + 4
        ws.merge_cells(start_row=r, start_column=1, end_row=r2, end_column=8)
        ws.cell(r, 1, "Physical Exam / Examen Físico").font = section_font
        ws.cell(r, 1).fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("examen_fisico", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = left_wrap
        r = r2 + 1

        r2 = r + 4
        ws.merge_cells(start_row=r, start_column=1, end_row=r2, end_column=8)
        ws.cell(r, 1, "Diagnosis / Diagnóstico").font = section_font
        ws.cell(r, 1).fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
        ws.cell(r, 1).border = border
        ws.cell(r, 2, d.get("diagnostico", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = left_wrap
        r = r2 + 1

        ws.cell(r, 1, "Nombre del Médico").font = label_font
        ws.cell(r, 1).fill = label_fill
        ws.cell(r, 1).border = border
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
        ws.cell(r, 2, d.get("nombre_medico", "")).font = normal_font
        ws.cell(r, 2).border = border
        ws.cell(r, 2).alignment = center
        ws.cell(r, 5, "Cirujano").font = label_font
        ws.cell(r, 5).fill = label_fill
        ws.cell(r, 5).border = border
        ws.merge_cells(start_row=r, start_column=6, end_row=r, end_column=8)
        ws.cell(r, 6, d.get("cirujano", "")).font = normal_font
        ws.cell(r, 6).border = border
        ws.cell(r, 6).alignment = center
        r += 1

        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, f"Surgery Date / Fecha de Cirugía: {d.get('fecha_cirugia', '')}").font = Font(bold=True, size=11)
        ws.cell(r, 1).alignment = center
        ws.cell(r, 1).border = border
        r += 1

        ws.column_dimensions['A'].width = 18
        ws.column_dimensions['B'].width = 18
        ws.column_dimensions['C'].width = 18
        ws.column_dimensions['D'].width = 18
        ws.column_dimensions['E'].width = 18
        ws.column_dimensions['F'].width = 18
        ws.column_dimensions['G'].width = 18
        ws.column_dimensions['H'].width = 18

        ws.sheet_properties.pageSetUpPr = None

    wb.save(filepath)
