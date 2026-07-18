from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy.orm import Session
from app.models.list_definition import ListDefinition, ListRecord
from app.schemas.list_definition import ListDefinitionCreate



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
    {"key": "expediente", "label": "Expediente", "type": "text"},
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
    from app.services.list_service import create_list_definition
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

    title_font = Font(bold=True, size=16)
    label_font = Font(bold=True, size=10)
    section_font = Font(bold=True, size=10)
    value_small = Font(size=10)
    value_medical = Font(size=14)
    value_identidad = Font(size=14)
    value_vitals = Font(size=11)
    value_diagnosis = Font(bold=True, size=14)
    value_doctor = Font(size=14)
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_wrap = Alignment(horizontal="left", vertical="top", wrap_text=True)
    yellow_fill = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")

    col_widths = {
        'A': 11.43, 'B': 16.0, 'C': 11.43, 'D': 16.0,
        'E': 9.43, 'F': 10.14, 'G': 11.71, 'H': 14.86,
        'I': 15.29, 'J': 13.71,
    }

    for row_idx, record in enumerate(records):
        d = record.data if record.data else {}

        if row_idx > 0:
            ws.append([])
            r = ws.max_row + 1
        else:
            r = 1

        # Row 1: Centro Médico (merged A1:H1)
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, d.get("centro_medico", "Centro Médico")).font = title_font
        ws.cell(r, 1).alignment = center
        r += 1

        # Row 2: Especialidad (G-H, size 16), Criticidad clínica (I, yellow), Estatus de paciente (J, yellow)
        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=8)
        ws.cell(r, 7, "Especialidad").font = Font(bold=True, size=16)
        ws.cell(r, 7).alignment = center
        c = ws.cell(r, 9, "Criticidad clínica")
        c.font = label_font
        c.fill = yellow_fill
        c.alignment = center
        c = ws.cell(r, 10, "Estatus de paciente")
        c.font = label_font
        c.fill = yellow_fill
        c.alignment = center
        r += 1

        # Row 3: Label row
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Nombre/First Name").font = label_font
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
        ws.cell(r, 3, "Apellido/ Last Name").font = label_font
        ws.cell(r, 5, "Sexo/Sex").font = label_font
        ws.cell(r, 6, "Age/Edad").font = label_font
        ws.merge_cells(start_row=r, start_column=7, end_row=r, end_column=8)
        ws.cell(r, 7, "Fecha de Elaboración (d/m/a)").font = label_font
        r += 1

        # Row 4-5: Values + Procedencia label header (I4:I5, yellow)
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=2)
        ws.cell(r, 1, d.get("nombre", "")).font = Font(size=14)
        ws.cell(r, 1).alignment = center
        ws.merge_cells(start_row=r, start_column=3, end_row=r+1, end_column=4)
        ws.cell(r, 3, d.get("apellido", "")).font = Font(size=15)
        ws.cell(r, 3).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r+1, end_column=5)
        ws.cell(r, 5, d.get("sexo", "")).font = Font(size=16)
        ws.cell(r, 5).alignment = center
        ws.merge_cells(start_row=r, start_column=6, end_row=r+1, end_column=6)
        ws.cell(r, 6, str(d.get("edad", ""))).font = Font(bold=True, size=16)
        ws.cell(r, 6).alignment = center
        ws.merge_cells(start_row=r, start_column=7, end_row=r+1, end_column=8)
        ws.cell(r, 7, str(d.get("fecha_elaboracion", ""))).font = Font(size=16)
        ws.cell(r, 7).alignment = center
        ws.merge_cells(start_row=r, start_column=9, end_row=r+1, end_column=9)
        c = ws.cell(r, 9, "Procedencia")
        c.font = label_font
        c.fill = yellow_fill
        c.alignment = center
        r += 2

        # Row 6: Labels - Nº Identidad, Persona Responsable, Albergue, Perfil, Teléfono, Expediente
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.cell(r, 1, "Nº Identidad").font = label_font
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
        ws.cell(r, 3, "Persona Responsable").font = label_font
        ws.cell(r, 5, "Albergue").font = label_font
        ws.cell(r, 6, "Perfil").font = label_font
        ws.cell(r, 7, "Teléfono").font = label_font
        ws.cell(r, 8, "Expediente").font = label_font
        r += 1

        # Row 7-8: Values for identification + Procedencia value (I6:I8)
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=2)
        ws.cell(r, 1, d.get("identidad", "")).font = value_identidad
        ws.cell(r, 1).alignment = center
        ws.merge_cells(start_row=r, start_column=3, end_row=r+1, end_column=4)
        ws.cell(r, 3, d.get("persona_responsable", "")).font = value_small
        ws.cell(r, 3).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r+1, end_column=5)
        ws.cell(r, 5, d.get("albergue", "")).font = value_small
        ws.cell(r, 5).alignment = center
        ws.merge_cells(start_row=r, start_column=6, end_row=r+1, end_column=6)
        ws.cell(r, 6, d.get("perfil", "")).font = value_small
        ws.cell(r, 6).alignment = center
        ws.merge_cells(start_row=r, start_column=7, end_row=r+1, end_column=7)
        ws.cell(r, 7, d.get("telefono", "")).font = value_small
        ws.cell(r, 7).alignment = center
        ws.merge_cells(start_row=r, start_column=8, end_row=r+1, end_column=8)
        ws.cell(r, 8, d.get("expediente", "")).font = value_small
        ws.cell(r, 8).alignment = center
        ws.merge_cells(start_row=r-1, start_column=9, end_row=r+1, end_column=9)
        ws.cell(r-1, 9, d.get("procedencia", "")).font = value_small
        ws.cell(r-1, 9).alignment = center
        r += 2

        # Row 9-10: Domicilio
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=2)
        ws.cell(r, 1, "Domicilio del  Paciente:").font = label_font
        ws.merge_cells(start_row=r, start_column=3, end_row=r+1, end_column=8)
        ws.cell(r, 3, d.get("domicilio", "")).font = value_medical
        ws.cell(r, 3).alignment = left_wrap
        r += 2

        # Row 11: blank (spacer)
        r += 1

        # Row 12: History of Present Illness
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, "History of Present Illness/Historia de Enfermedad Actual:      ").font = section_font
        r += 1

        # Row 13-17: History value
        ws.merge_cells(start_row=r, start_column=1, end_row=r+4, end_column=8)
        ws.cell(r, 1, d.get("historia_enfermedad", "")).font = value_medical
        ws.cell(r, 1).alignment = left_wrap
        r += 5

        # Row 18: blank (spacer)
        r += 1

        # Row 19: Medical History
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, "Medical History/Antecedentes:").font = section_font
        r += 1

        # Row 20-21: Previous illness
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=3)
        ws.cell(r, 1, "Previous illness/ Enfermedades anteriores:").font = label_font
        ws.merge_cells(start_row=r, start_column=4, end_row=r+1, end_column=8)
        ws.cell(r, 4, d.get("enfermedades_previas", "")).font = value_medical
        ws.cell(r, 4).alignment = left_wrap
        r += 2

        # Row 22-23: Past surgeries
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=3)
        ws.cell(r, 1, "Past surgeries/ Cirugías anteriores:").font = label_font
        ws.merge_cells(start_row=r, start_column=4, end_row=r+1, end_column=8)
        ws.cell(r, 4, d.get("cirugias_previas", "")).font = value_medical
        ws.cell(r, 4).alignment = left_wrap
        r += 2

        # Row 24-25: Allergies
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=3)
        ws.cell(r, 1, "Allergies/Alergias:").font = label_font
        ws.merge_cells(start_row=r, start_column=4, end_row=r+1, end_column=8)
        ws.cell(r, 4, d.get("alergias", "")).font = value_medical
        ws.cell(r, 4).alignment = left_wrap
        r += 2

        # Row 26-27: Other
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=3)
        ws.cell(r, 1, "Other/Otros Antecedentes").font = label_font
        ws.merge_cells(start_row=r, start_column=4, end_row=r+1, end_column=8)
        ws.cell(r, 4, d.get("otros_antecedentes", "")).font = value_medical
        ws.cell(r, 4).alignment = left_wrap
        r += 2

        # Row 28: blank
        r += 1

        # Row 29: Vital signs (part 1)
        ws.merge_cells(start_row=r, start_column=1, end_row=r+1, end_column=1)
        ws.cell(r, 1, "P.A./.B P:").font = label_font
        ws.merge_cells(start_row=r, start_column=2, end_row=r+1, end_column=2)
        ws.cell(r, 2, d.get("presion_arterial", "")).font = value_vitals
        ws.cell(r, 2).alignment = center
        ws.merge_cells(start_row=r, start_column=3, end_row=r+1, end_column=3)
        fc_val = d.get("fc", "")
        ws.cell(r, 3, f"F.C.: {fc_val}" if fc_val else "").font = label_font
        ws.cell(r, 3).alignment = center
        pulso_val = d.get("pulso", "")
        ws.cell(r, 4, f"Pulso: {pulso_val}" if pulso_val else "").font = label_font
        ws.cell(r, 4).alignment = center
        ws.merge_cells(start_row=r, start_column=5, end_row=r+1, end_column=5)
        temp_val = d.get("temperatura", "")
        ws.cell(r, 5, f"T°: {temp_val}°C" if temp_val else "").font = label_font
        ws.cell(r, 5).alignment = center
        ws.merge_cells(start_row=r, start_column=6, end_row=r+1, end_column=6)
        fr_val = d.get("fr", "")
        ws.cell(r, 6, f"F.R.: {fr_val}" if fr_val else "").font = label_font
        ws.cell(r, 6).alignment = center
        ws.cell(r, 7, "Peso/Weight:").font = label_font
        ws.cell(r, 8, d.get("peso", "")).font = value_vitals
        ws.cell(r, 8).alignment = center
        r += 1
        talla_val = d.get("talla", "")
        ws.cell(r, 4, f"Talla: {talla_val}" if talla_val else "").font = label_font
        ws.cell(r, 4).alignment = center
        ws.cell(r, 7, "B.M.I.:").font = label_font
        ws.cell(r, 8, d.get("bmi", "")).font = value_vitals
        ws.cell(r, 8).alignment = center
        r += 1

        # Row 31: Physical Exam section header
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        ws.cell(r, 1, "Physical Exam /Examen Físico ").font = section_font
        r += 1

        # Row 32-36: Physical exam value
        ws.merge_cells(start_row=r, start_column=1, end_row=r+4, end_column=8)
        ws.cell(r, 1, d.get("examen_fisico", "")).font = value_medical
        ws.cell(r, 1).alignment = left_wrap
        r += 5

        # Row 37: Diagnosis section (col D)
        ws.cell(r, 4, "Diagnosis/ Diagnóstico").font = section_font
        r += 1

        # Row 38-42: Diagnosis value
        ws.merge_cells(start_row=r, start_column=1, end_row=r+4, end_column=8)
        ws.cell(r, 1, d.get("diagnostico", "")).font = value_diagnosis
        ws.cell(r, 1).alignment = left_wrap
        r += 5

        # Row 43: blank
        r += 1

        # Row 44: Doctor name
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=7)
        ws.cell(r, 2, d.get("nombre_medico", "")).font = value_doctor
        ws.cell(r, 2).alignment = center
        r += 1

        # Row 45: "Nombre del Médico"
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=7)
        ws.cell(r, 2, "    Nombre del Médico").font = label_font
        ws.cell(r, 2).alignment = center
        r += 2

        # Row 48: Surgeon
        ws.cell(r, 1, "Surgeon/ Cirujano:").font = label_font
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 3, d.get("cirujano", "")).font = value_doctor
        ws.cell(r, 3).alignment = center
        r += 2

        # Row 50: Surgery Date
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        surgery_date = d.get("fecha_cirugia", "")
        ws.cell(r, 1, f"Surgery Date/ Day of the Week   Fecha de Cirugía/Día de la Semana:   {surgery_date}").font = Font(bold=True, size=11)
        ws.cell(r, 1).alignment = center

    for col_letter, w in col_widths.items():
        ws.column_dimensions[col_letter].width = w

    wb.save(filepath)
