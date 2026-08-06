#!/usr/bin/env python3
"""Genera los manuales de usuario y el Acuerdo Marco del sistema en PDF (Versión 1.1).

Replica el formato original: hoja carta (letter), encabezado en cada página,
títulos en serif y cuerpo en sans-serif, pie de página con página y versión.

Uso:
    python generate_docs.py [--out DIR]
"""

import os
import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
SERIF = "Times-Roman"
SERIF_B = "Times-Bold"
SERIF_I = "Times-Italic"
SANS = "Helvetica"
SANS_B = "Helvetica-Bold"
SANS_O = "Helvetica-Oblique"

def _mk(name, font, size, leading, align=TA_LEFT, space_before=0, space_after=6, color=colors.HexColor("#1F2937"), **kwargs):
    return ParagraphStyle(
        name, fontName=font, fontSize=size, leading=leading, alignment=align,
        spaceBefore=space_before, spaceAfter=space_after, textColor=color,
        bulletFontName=kwargs.pop("bulletFontName", font), bulletFontSize=kwargs.pop("bulletFontSize", size), bulletIndent=kwargs.pop("bulletIndent", 0),
        **kwargs,
    )

st_title = _mk("title", SERIF_B, 22, 28, TA_CENTER, 0, 6)
st_subtitle = _mk("subtitle", SERIF, 13, 18, TA_CENTER, 0, 6)
st_ver = _mk("ver", SANS, 10, 14, TA_CENTER, 0, 2, colors.HexColor("#6B7280"))
st_h1 = _mk("h1", SERIF_B, 14, 18, TA_LEFT, 14, 6, colors.HexColor("#374151"))
st_h2 = _mk("h2", SERIF_B, 11.5, 15, TA_LEFT, 10, 4, colors.HexColor("#4B5563"))
st_body = _mk("body", SANS, 10, 14.5, TA_JUSTIFY, 0, 5)
st_bullet = _mk("bullet", SANS, 10, 14.5, TA_JUSTIFY, 0, 3, colors.HexColor("#1F2937"),
                bulletFontName=SANS, bulletFontSize=10)
st_num = _mk("num", SANS, 10, 14.5, TA_JUSTIFY, 0, 3)
st_note = _mk("note", SANS_O, 9.5, 13.5, TA_LEFT, 0, 5, colors.HexColor("#6B7280"))
st_table_head = _mk("thead", SANS_B, 9, 11, TA_LEFT, 0, 0, colors.white)
st_table_cell = _mk("tcell", SANS, 9, 11.5, TA_LEFT, 0, 0)
st_table_cell_c = _mk("tcellc", SANS, 9, 11.5, TA_CENTER, 0, 0)
st_quote = _mk("quote", SERIF_I, 10, 14.5, TA_JUSTIFY, 0, 5)

# ---------------------------------------------------------------------------
# Encabezado y pie de página
# ---------------------------------------------------------------------------
class DocBuilder:
    def __init__(self, path, header_left, header_right, version):
        self.path = path
        self.header_left = header_left
        self.header_right = header_right
        self.version = version
        self.story = []
        self.base = os.path.dirname(os.path.abspath(path))

    def build(self):
        doc = SimpleDocTemplate(
            self.path, pagesize=letter,
            leftMargin=2.2 * cm, rightMargin=2.2 * cm,
            topMargin=3.0 * cm, bottomMargin=2.2 * cm,
            title="Centro Médico San Benito José",
            author="TurtleLite",
        )

        def on_page(canvas, doc_):
            canvas.saveState()
            # encabezado
            canvas.setFont(SANS_B, 8)
            canvas.setFillColor(colors.HexColor("#6B7280"))
            canvas.drawString(2.2 * cm, letter[1] - 1.4 * cm, self.header_left)
            canvas.drawRightString(letter[0] - 2.2 * cm, letter[1] - 1.4 * cm, self.header_right)
            canvas.setStrokeColor(colors.HexColor("#D1D5DB"))
            canvas.setLineWidth(0.6)
            canvas.line(2.2 * cm, letter[1] - 1.65 * cm, letter[0] - 2.2 * cm, letter[1] - 1.65 * cm)
            # pie
            canvas.setFont(SANS, 8)
            canvas.setFillColor(colors.HexColor("#9CA3AF"))
            canvas.drawCentredString(letter[0] / 2, 1.4 * cm, f"Página {canvas.getPageNumber()}")
            canvas.drawCentredString(letter[0] / 2, 1.1 * cm, f"Versión {self.version}")
            canvas.restoreState()

        doc.build(self.story, onFirstPage=on_page, onLaterPages=on_page)

    # -- ayudas de contenido --
    def h1(self, text):
        self.story.append(Paragraph(text, st_h1))

    def h2(self, text):
        self.story.append(Paragraph(text, st_h2))

    def body(self, text):
        self.story.append(Paragraph(text, st_body))

    def note(self, text):
        self.story.append(Paragraph(text, st_note))

    def bullet(self, text):
        self.story.append(Paragraph(text, st_bullet, bulletText="•"))

    def numbered(self, text):
        self.story.append(Paragraph(text, st_num))

    def quote(self, text):
        self.story.append(Paragraph(text, st_quote))

    def spacer(self, h=0.4):
        self.story.append(Spacer(1, h * cm))

    def pagebreak(self):
        self.story.append(PageBreak())

    def table(self, rows, col_widths=None, header=True, center_cols=()):
        data = [list(r) for r in rows]
        style = [
            ("FONTNAME", (0, 0), (-1, -1), SANS),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("LEADING", (0, 0), (-1, -1), 11.5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6E7B91")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), SANS_B),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F9FA")]),
        ]
        if not header:
            style.remove(("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6E7B91")))
            style.remove(("TEXTCOLOR", (0, 0), (-1, 0), colors.white))
            style.remove(("FONTNAME", (0, 0), (-1, 0), SANS_B))
        for c in center_cols:
            style.append(("ALIGN", (c, 0), (c, -1), "CENTER"))
        t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
        t.setStyle(TableStyle(style))
        self.story.append(t)
        self.spacer(0.3)

    def cover(self, center_text, subtitle, version, elaborated):
        self.spacer(3.2)
        self.story.append(Paragraph(center_text, st_title))
        self.spacer(0.3)
        self.story.append(Paragraph(subtitle, st_subtitle))
        self.spacer(2.6)
        self.story.append(Paragraph("Manual de Usuario", st_title))
        self.spacer(0.5)
        self.story.append(Paragraph(elaborated, st_subtitle))
        self.spacer(1.2)
        self.story.append(Paragraph(f"Versión {version}", st_ver))
        self.story.append(Paragraph("Elaborado por TurtleLite", st_ver))
        self.pagebreak()

    def legal_cover(self, title_lines, version):
        self.spacer(2.8)
        self.story.append(Paragraph(title_lines[0], st_title))
        self.spacer(0.6)
        for line in title_lines[1:]:
            self.story.append(Paragraph(line, st_subtitle))
        self.spacer(2.2)
        self.story.append(Paragraph(f"Versión {version}", st_ver))
        self.story.append(Paragraph("Documento confidencial", st_ver))
        self.pagebreak()


# ---------------------------------------------------------------------------
# Contenido: Manual de Usuario - Dirección
# ---------------------------------------------------------------------------
ROLE_TABLE = [
    ["Rol", "Descripción", "Alcance general"],
    ["Administrador", "Gestiona usuarios, especialidades, localidades y configuración del sistema.", "Acceso total al sistema."],
    ["Dirección", "Consulta y gestiona expedientes (crear, editar, eliminar), reportes, listados diarios y estatus de cirugía.", "Expedientes, reportes, listados y estatus."],
    ["Dirección Médica", "Gestiona expedientes, reportes, listados diarios y estatus de cirugía.", "Expedientes, reportes, listados y estatus."],
    ["Médico", "Crea y edita sus propios expedientes. No puede eliminar expedientes.", "Expedientes propios."],
]

INTRO = [
    ("h1", "1. Introducción y acceso al sistema"),
    ("h2", "1.1. ¿Qué es el sistema?"),
    ("body", "El Sistema Web de Gestión de Expedientes Médicos es la plataforma oficial del Centro Médico San Benito José. Permite registrar y consultar los expedientes de los pacientes, generar reportes en Excel, armar el listado diario de cirugías y gestionar el estatus de cada cirugía, todo desde el navegador y de forma centralizada."),
    ("h2", "1.2. Roles del sistema"),
    ("body", "Cada usuario pertenece a un rol que determina las funciones que puede realizar. Los roles son los siguientes:"),
    ("table", ROLE_TABLE, [3.6 * cm, 8.4 * cm, 4.0 * cm]),
    ("note", "Nota: Su rol es {rol}. Las secciones de este manual describen únicamente lo que su rol puede hacer."),
    ("h2", "1.3. Requisitos para usar el sistema"),
    ("bullet", "Un navegador actualizado (Google Chrome, Microsoft Edge o Firefox)."),
    ("bullet", "Conexión a internet estable."),
    ("bullet", "Un usuario y contraseña asignados por el administrador del sistema."),
    ("h2", "1.4. Inicio de sesión (paso a paso)"),
    ("numbered", "1. Abra el navegador y vaya a la dirección: <b>https://sistema-web-expedientes-cmsbj.onrender.com/</b>"),
    ("numbered", "2. En la pantalla de inicio, escriba su nombre de usuario en el campo \"Usuario\"."),
    ("numbered", "3. Escriba su contraseña en el campo correspondiente."),
    ("numbered", "4. Presione el botón <b>Iniciar sesión</b>."),
    ("numbered", "5. El sistema lo llevará al Inicio, donde verá el resumen general."),
    ("note", "Nota: Si los datos son incorrectos, el sistema mostrará un mensaje de error en rojo. Verifique que no haya espacios o mayúsculas adicionales."),
    ("h2", "1.5. Seguridad de la sesión"),
    ("bullet", "La contraseña es personal e intransferible."),
    ("bullet", "Cierre sesión con el botón <b>Cerrar sesión</b> del menú lateral cuando termine su jornada."),
    ("bullet", "No comparta su sesión con otros usuarios, ni siquiera temporalmente."),
]

INTERFACE = [
    ("h1", "2. La interfaz del sistema"),
    ("h2", "2.1. El menú lateral"),
    ("body", "Al iniciar sesión verá el menú lateral (lado izquierdo), el encabezado con el nombre del centro médico y su rol, y el área de trabajo donde se muestran las secciones."),
    ("body", "Las secciones visibles en su menú son: {menus}."),
    ("bullet", "<b>Inicio:</b> resumen general del sistema."),
    ("bullet", "<b>Mi Perfil:</b> sus datos personales y contraseña."),
    ("bullet", "Las demás secciones dependen de su rol (descritas en el punto 3)."),
    ("note", "Nota: Si una sección no aparece en su menú, no tiene permiso para usarla. Al intentar acceder, el sistema muestra el mensaje \"No tienes acceso a [sección]\"."),
    ("h2", "2.2. El encabezado"),
    ("body", "En la parte superior se muestra el nombre del centro médico y, a la derecha, una etiqueta con su rol (Administrador, Dirección, Dirección Médica o Médico). En la esquina inferior derecha aparece la Versión del sistema como referencia."),
    ("h2", "2.3. Su perfil y cierre de sesión"),
    ("bullet", "Abajo del menú lateral aparece su nombre y rol; haga clic en su nombre para ir a Mi Perfil."),
    ("bullet", "Use el botón <b>Cerrar sesión</b> para salir del sistema de forma segura."),
]

PROFILE = [
    ("h1", "Mi Perfil (disponible para todos los roles)"),
    ("body", "La sección Mi Perfil le permite mantener sus datos al día. Procedimiento:"),
    ("numbered", "1. Haga clic en su nombre (abajo del menú lateral) o en el menú en Mi Perfil."),
    ("numbered", "2. En Título seleccione Dr., Dra., Lic. o \"Sin título\"."),
    ("numbered", "3. Escriba sus nombres y apellidos (el sistema los capitaliza automáticamente)."),
    ("numbered", "4. En Teléfono escriba el número con el formato 0000-0000 (cuatro dígitos, guion, cuatro dígitos). El sistema le inserta el guion automáticamente."),
    ("numbered", "5. Si desea cambiar la contraseña: escriba la contraseña actual y la nueva contraseña. Si no la va a cambiar, deje ambos campos vacíos."),
    ("numbered", "6. Presione <b>Guardar cambios</b>. Verá la confirmación \"Perfil actualizado correctamente\"."),
    ("note", "Nota: El usuario (nombre de usuario) no puede cambiarse desde el perfil; solo el administrador puede crear o modificar usuarios."),
]

RECOMMEND = [
    ("h1", "Recomendaciones y soporte"),
    ("h2", "Buenas prácticas"),
    ("bullet", "Registre los expedientes con datos completos y verificados: identidad, nombre, diagnóstico y especialidad."),
    ("bullet", "Revise los datos antes de guardar: los cambios se aplican de forma inmediata."),
    ("bullet", "Si detecta identidades repetidas, regularícelas para mantener la base de datos limpia."),
    ("bullet", "Cierre sesión al terminar, especialmente si comparte el equipo."),
    ("h2", "Soporte"),
    ("bullet", "Ante cualquier error o duda, comuníquese con el administrador del sistema."),
    ("bullet", "Indique el paso que estaba realizando y el mensaje mostrado para agilizar la atención."),
]

# ---------------------------------------------------------------------------
# Manuales por rol
# ---------------------------------------------------------------------------
def manual_direccion(out_dir, version="1.1"):
    b = DocBuilder(os.path.join(out_dir, "Manual_Usuario_Direccion.pdf"),
                   "Centro Médico San Benito José - Sistema Web de Gestión de Expedientes",
                   "Manual de Usuario - Dirección", version)
    b.cover("CENTRO MÉDICO SAN BENITO JOSÉ", "Sistema Web de Gestión de Expedientes Médicos", version, "Dirección")
    emit(b, INTRO, rol="Dirección")
    b.pagebreak()
    emit(b, INTERFACE, menus="Inicio, Mi Perfil, Expedientes, Reportes, Listados y Estatus Cirugía")
    b.pagebreak()

    b.h1("3. Funciones a las que SÍ tiene acceso, en detalle")
    b.h2("3.1. Inicio (panel principal)")
    b.body("Muestra un resumen del sistema: cantidad de expedientes registrados, reportes generados y estatus de las cirugías según su rol. Cada tarjeta del resumen lo lleva a la sección correspondiente.")

    b.h2("3.2. Expedientes (gestión completa)")
    b.body("Su rol puede crear, consultar, editar y eliminar expedientes.")
    b.h2("Buscar un expediente")
    b.numbered("1. En el menú lateral haga clic en <b>Expedientes</b>.")
    b.numbered("2. En el campo <b>Buscar...</b> escriba nombre, apellido, identidad, número de expediente, diagnóstico, especialidad o perfil.")
    b.numbered("3. El sistema busca automáticamente mientras escribe; no distingue mayúsculas ni tildes (ej.: \"lopez\" encuentra \"López\").")
    b.h2("Filtrar por especialidad")
    b.numbered("1. En el selector \"Todas las especialidades\" elija una (ej.: Oftalmología).")
    b.numbered("2. La lista se filtra al instante; el contador superior muestra la cantidad de expedientes.")
    b.h2("Crear un expediente")
    b.numbered("1. Presione el botón <b>Nuevo</b>.")
    b.numbered("2. Complete el formulario: identidad, nombre, apellido, edad, sexo, domicilio, teléfono, diagnóstico, especialidad, perfil y criticidad clínica, entre otros.")
    b.numbered("3. El número de expediente se asigna automáticamente en formato numérico (sin ceros a la izquierda: 1, 2, 3...).")
    b.numbered("4. Presione <b>Crear</b>. El expediente queda registrado inmediatamente.")
    b.h2("Editar un expediente")
    b.numbered("1. Marque la casilla del expediente a corregir.")
    b.numbered("2. Presione <b>Editar</b>, modifique los datos necesarios y presione <b>Actualizar</b>.")
    b.h2("Eliminar expedientes")
    b.numbered("1. Marque uno o varios expedientes.")
    b.numbered("2. Presione <b>Eliminar</b> y confirme la operación.")
    b.note("Nota: La eliminación es definitiva. Revise siempre antes de confirmar.")
    b.h2("Exportar expedientes a Excel")
    b.numbered("1. Para exportar todo el listado: botón <b>Exportar</b> (arriba a la derecha).")
    b.numbered("2. Para exportar solo algunos: selecciónelos con las casillas y presione <b>Exportar [n] seleccionados</b>.")
    b.h2("Vista previa del expediente")
    b.numbered("1. Use el botón <b>Ver</b> de la fila para consultar el expediente completo sin abrirlo en edición.")
    b.pagebreak()

    b.h2("3.3. Reportes")
    b.body("Los reportes son archivos Excel con información de los expedientes, útiles para estadísticas y seguimientos.")
    b.h2("Crear un reporte")
    b.numbered("1. En el menú haga clic en <b>Reportes</b> y luego en <b>Nuevo Reporte</b>.")
    b.numbered("2. Escriba un nombre descriptivo (ej.: \"Cirugías reprogramadas\").")
    b.numbered("3. Opcional: filtre por especialidad, perfil, criticidad clínica (Baja, Media o Alta) o estatus de cirugía.")
    b.numbered("4. Guarde el reporte.")
    b.h2("Ver la vista previa")
    b.numbered("1. Con el botón <b>Vista previa</b> revise los registros que incluirá el reporte.")
    b.numbered("2. Puede arrastrar las filas para acomodar la posición: la columna <b>No</b> permanece fija y no cambia con el reordenamiento.")
    b.numbered("3. Verifique que la información sea la esperada antes de generar el archivo.")
    b.h2("Generar y descargar el Excel")
    b.numbered("1. Presione <b>Generar Excel</b>. El sistema crea el archivo REPORTE_EXPEDIENTES_N.xlsx (la numeración avanza por cada reporte generado por usted).")
    b.numbered("2. Use <b>Descargar</b> para guardar el archivo en su equipo.")
    b.note("Nota: La columna \"Observación\" solo aparece en los reportes.")
    b.h2("Eliminar un reporte")
    b.numbered("1. Use el botón de eliminar del reporte y confirme. El reporte y su archivo se eliminan.")

    b.h2("3.4. Listado Diario de Cirugías")
    b.body("Permite armar el listado de cirugías de cada fecha, que luego se exporta a Excel.")
    b.numbered("1. Vaya a <b>Listados</b> en el menú.")
    b.numbered("2. Elija la fecha con el selector de fecha o las flechas (el botón \"Hoy\" vuelve al día actual).")
    b.numbered("3. En el panel izquierdo (disponibles), busque al paciente y agréguelo con el botón \"+\". Puede filtrar por estatus de cirugía (\"En espera\" por defecto, Reprogramar, Cancelado, No se presentó o todos).")
    b.numbered("4. Arrastre a cada paciente para reordenarlo dentro de su especialidad.")
    b.numbered("5. Presione <b>Guardar</b> para guardar el listado y <b>Excel</b> para descargarlo.")

    b.h2("3.5. Estatus Cirugía")
    b.body("Módulo para controlar el estado de cada cirugía programada.")
    b.h2("Revisar los estatus")
    b.numbered("1. En el menú haga clic en <b>Estatus Cirugía</b>.")
    b.numbered("2. Use el filtro de estatus si desea ver solo un grupo (ej.: \"En espera\").")
    b.h2("Cambiar el estatus de una cirugía")
    b.numbered("1. Localice el expediente en la tabla.")
    b.numbered("2. En la columna de estatus, seleccione el nuevo estado: En espera, Reprogramar, Cancelado, Fuera de perfil San Benito, Operado, No apto para cirugía o No se presentó.")
    b.numbered("3. Puede escribir una observación que quedará registrada en el expediente.")
    b.numbered("4. El cambio se guarda de forma inmediata y queda registrado en el expediente.")
    b.pagebreak()

    emit(b, PROFILE)
    b.pagebreak()

    b.h1("Funciones a las que NO tiene acceso")
    b.body("Su rol no incluye las funciones de la siguiente tabla. Si intenta ingresar a esas secciones, el sistema mostrará el mensaje \"No tienes acceso\" y no abrirá la página:")
    b.table([
        ["Función / Módulo", "Disponible para", "Comportamiento con su rol"],
        ["Usuarios (crear, editar, eliminar, restablecer)", "Solo Administrador", "Menú oculto."],
        ["Administrar especialidades y localidades", "Solo Administrador", "Botones no disponibles."],
        ["Importar expedientes desde Excel", "Solo Administrador", "Sin acceso."],
        ["Cambiar contraseñas de otros usuarios", "Solo Administrador", "Sin acceso a Usuarios."],
    ], [5.6 * cm, 4.4 * cm, 5.0 * cm])
    b.spacer(0.6)
    b.h1("Preguntas frecuentes")
    b.quote("¿Puedo crear un expediente nuevo?")
    b.body("Sí. Su rol puede crear, editar y eliminar expedientes.")
    b.quote("¿Puedo editar los datos de un paciente?")
    b.body("Sí. Marque el expediente y presione Editar.")
    b.quote("¿Puedo cambiar el estatus de cirugía?")
    b.body("Sí. Use la sección Estatus Cirugía.")
    b.quote("¿Puedo descargar un reporte sin generarlo antes?")
    b.body("No. Primero debe presionar \"Generar Excel\"; luego aparece disponible el botón \"Descargar\".")
    b.quote("¿Se mueve la columna No al reordenar el reporte?")
    b.body("No. Los números (1, 2, 3...) indican la posición del registro en el reporte y permanecen en su lugar; al arrastrar solo se desplazan los datos del paciente.")
    b.pagebreak()

    emit(b, RECOMMEND)
    b.build()


def manual_direccion_medica(out_dir, version="1.1"):
    b = DocBuilder(os.path.join(out_dir, "Manual_Usuario_Direccion_Medica.pdf"),
                   "Centro Médico San Benito José - Sistema Web de Gestión de Expedientes",
                   "Manual de Usuario - Dirección Médica", version)
    b.cover("CENTRO MÉDICO SAN BENITO JOSÉ", "Sistema Web de Gestión de Expedientes Médicos", version, "Dirección Médica")
    emit(b, INTRO, rol="Dirección Médica")
    b.pagebreak()
    emit(b, INTERFACE, menus="Inicio, Mi Perfil, Expedientes, Reportes, Listados y Estatus Cirugía")
    b.pagebreak()

    b.h1("3. Funciones a las que SÍ tiene acceso, en detalle")
    b.h2("3.1. Inicio (panel principal)")
    b.body("Muestra un resumen del sistema: expedientes registrados, reportes generados y listados del día. Cada tarjeta lo lleva a la sección correspondiente.")

    b.h2("3.2. Expedientes (gestión completa)")
    b.body("Buscar y filtrar")
    b.numbered("1. Haga clic en <b>Expedientes</b> en el menú lateral.")
    b.numbered("2. Use <b>Buscar...</b> (no distingue mayúsculas ni tildes) o el filtro de especialidad.")
    b.numbered("3. La lista carga de 50 en 50; deslice hasta el final para cargar más expedientes.")
    b.body("Crear un expediente")
    b.numbered("1. Presione el botón <b>Nuevo</b>.")
    b.numbered("2. Complete el formulario: identidad, nombre, apellido, edad, sexo, domicilio, teléfono, diagnóstico, especialidad, perfil y criticidad clínica (Baja, Media o Alta), entre otros campos. Número de expediente: automático, en formato numérico sin ceros a la izquierda.")
    b.numbered("3. Presione <b>Crear</b>. El expediente queda registrado inmediatamente.")
    b.note("Nota: Registre la identidad correctamente: el sistema avisa cuando una misma identidad está repetida.")
    b.body("Editar un expediente")
    b.numbered("1. Marque la casilla del expediente a corregir.")
    b.numbered("2. Presione <b>Editar</b>, modifique los datos necesarios y <b>Actualice</b>.")
    b.body("Eliminar expedientes")
    b.numbered("1. Marque uno o varios expedientes.")
    b.numbered("2. Presione <b>Eliminar</b> y confirme la operación.")
    b.note("Nota: La eliminación es definitiva. Revise siempre antes de confirmar.")
    b.body("Exportar a Excel")
    b.numbered("1. <b>Exportar:</b> descarga todos los expedientes de la lista.")
    b.numbered("2. <b>Exportar [n] seleccionados:</b> descarga solo los marcados.")
    b.pagebreak()

    b.h2("3.3. Reportes")
    b.body("Crear un reporte")
    b.numbered("1. Vaya a <b>Reportes</b> → <b>Nuevo Reporte</b>.")
    b.numbered("2. Asigne nombre y, opcionalmente, filtre por especialidad, perfil, criticidad clínica o estatus de cirugía.")
    b.numbered("3. Guarde el reporte.")
    b.body("Generar, descargar y eliminar")
    b.numbered("1. <b>Vista previa:</b> revise los registros incluidos. Puede arrastrar filas; la columna <b>No</b> permanece fija.")
    b.numbered("2. <b>Generar Excel:</b> crea REPORTE_EXPEDIENTES_N.xlsx (numeración por usuario).")
    b.numbered("3. <b>Descargar:</b> guarda el archivo en su equipo.")
    b.numbered("4. <b>Eliminar:</b> borra reportes que ya no necesite.")
    b.note("Nota: La columna \"Observación\" solo aparece en los reportes.")

    b.h2("3.4. Listado Diario de Cirugías")
    b.body("Permite armar el listado de cirugías de cada fecha, que luego se exporta a Excel.")
    b.numbered("1. Vaya a <b>Listados</b> en el menú.")
    b.numbered("2. Elija la fecha con el selector de fecha o las flechas (el botón \"Hoy\" vuelve al día actual).")
    b.numbered("3. En el panel izquierdo (disponibles), busque al paciente; el filtro de estatus muestra \"En espera\" por defecto, o puede elegir Reprogramar, Cancelado, No se presentó o todos.")
    b.numbered("4. Agregue el paciente con el botón \"+\". Se ubica en la sección de su especialidad.")
    b.numbered("5. Arrastre a cada paciente con la manija (ícono de agarre) para reordenarlo dentro de su especialidad.")
    b.numbered("6. <b>Guardar:</b> guarda el listado de la fecha. <b>Excel:</b> descarga LISTADO_fecha.xlsx. <b>Vaciar:</b> elimina el listado de esa fecha (requiere confirmación).")

    b.h2("3.5. Estatus Cirugía")
    b.body("Módulo para controlar el estado de cada cirugía programada.")
    b.numbered("1. En el menú haga clic en <b>Estatus Cirugía</b>.")
    b.numbered("2. Use el filtro de estatus si desea ver solo un grupo.")
    b.numbered("3. En la columna de estatus, seleccione el nuevo estado y escriba una observación si lo desea.")
    b.numbered("4. Presione <b>Guardar</b>. El cambio queda registrado en el expediente.")
    b.pagebreak()

    emit(b, PROFILE)
    b.pagebreak()

    b.h1("Funciones a las que NO tiene acceso")
    b.body("Su rol no incluye las funciones de la siguiente tabla. Si intenta ingresar a esas secciones, el sistema mostrará el mensaje \"No tienes acceso\" y no abrirá la página:")
    b.table([
        ["Función / Módulo", "Disponible para", "Comportamiento con su rol"],
        ["Usuarios (crear, editar, eliminar, restablecer)", "Solo Administrador", "Menú oculto."],
        ["Administrar especialidades y localidades", "Solo Administrador", "Botones no disponibles."],
        ["Importar expedientes desde Excel", "Solo Administrador", "Sin acceso."],
        ["Cambiar contraseñas de otros usuarios", "Solo Administrador", "Sin acceso a Usuarios."],
    ], [5.6 * cm, 4.4 * cm, 5.0 * cm])
    b.spacer(0.6)
    b.h1("Preguntas frecuentes")
    b.quote("¿Puedo cambiar el estatus de cirugía de un paciente?")
    b.body("Sí. Su rol puede asignar y cambiar el estatus de cirugía desde la sección Estatus Cirugía.")
    b.quote("¿Puedo editar un expediente creado por un médico?")
    b.body("Sí. La Dirección Médica puede editar y eliminar cualquier expediente.")
    b.quote("¿Qué significan los avisos de \"Duplicados\"?")
    b.body("Indican que existe más de un expediente con la misma identidad. Conviene revisarlos para evitar expedientes repetidos.")
    b.quote("¿Puedo guardar el listado de un día sin completarlo?")
    b.body("Sí, puede guardarlo en cualquier momento y continuar más tarde; al volver a la fecha, el listado se recupera tal como lo dejó.")
    b.quote("¿El reporte se actualiza solo?")
    b.body("No. Si cambian los expedientes, debe presionar \"Generar Excel\" de nuevo para actualizar el archivo.")
    b.quote("¿Se mueve la columna No al reordenar el reporte?")
    b.body("No. Los números (1, 2, 3...) indican la posición del registro en el reporte y permanecen en su lugar; al arrastrar solo se desplazan los datos del paciente.")
    b.pagebreak()

    emit(b, RECOMMEND)
    b.build()


def manual_medico(out_dir, version="1.1"):
    b = DocBuilder(os.path.join(out_dir, "Manual_Usuario_Medico.pdf"),
                   "Centro Médico San Benito José - Sistema Web de Gestión de Expedientes",
                   "Manual de Usuario - Médico", version)
    b.cover("CENTRO MÉDICO SAN BENITO JOSÉ", "Sistema Web de Gestión de Expedientes Médicos", version, "Médico")
    emit(b, INTRO, rol="Médico")
    b.pagebreak()
    emit(b, INTERFACE, menus="Inicio, Mi Perfil y Expedientes")
    b.pagebreak()

    b.h1("3. Funciones a las que SÍ tiene acceso, en detalle")
    b.h2("3.1. Inicio (panel principal)")
    b.body("Muestra el resumen general del sistema: expedientes registrados y otras estadísticas permitidas para su rol.")

    b.h2("3.2. Expedientes")
    b.body("Consultar expedientes")
    b.numbered("1. Haga clic en <b>Expedientes</b> en el menú lateral.")
    b.numbered("2. Busque con el campo <b>Buscar...</b>: no distingue mayúsculas ni tildes (busca en nombre, apellido, identidad, expediente, diagnóstico, especialidad y perfil).")
    b.numbered("3. Filtre por especialidad si necesita un grupo específico.")
    b.numbered("4. La lista carga de 50 en 50; deslice hacia abajo para cargar más.")
    b.body("Crear un expediente")
    b.numbered("1. Presione el botón <b>Nuevo</b>.")
    b.numbered("2. Complete el formulario con los datos del paciente (identidad, nombre, apellido, edad, sexo, domicilio, teléfono, diagnóstico, especialidad, perfil y criticidad clínica, entre otros). Número de expediente: automático, en formato numérico sin ceros a la izquierda.")
    b.numbered("3. Presione <b>Crear</b>. El expediente queda registrado a su nombre.")
    b.note("Nota: Verifique la identidad y los datos antes de guardar: solo puede editar los expedientes que usted creó, y no puede eliminarlos ni cambiar el estatus de cirugía.")
    b.body("Editar un expediente propio")
    b.numbered("1. Marque la casilla del expediente que usted creó.")
    b.numbered("2. Presione <b>Editar</b>, haga las correcciones y presione <b>Actualizar</b>.")
    b.note("Nota: Solo puede editar los expedientes que usted mismo creó. Si intenta editar uno de otro médico, el sistema mostrará \"No puedes editar un expediente creado por otro médico\".")
    b.body("Exportar expedientes")
    b.numbered("1. <b>Exportar:</b> descarga todos los expedientes en Excel.")
    b.numbered("2. <b>Exportar [n] seleccionados:</b> descarga solo los expedientes marcados.")
    b.body("Revisar duplicados")
    b.numbered("1. Si existen identidades repetidas, aparece el botón <b>Duplicados</b>.")
    b.numbered("2. Tóquelo para ver los grupos y luego cada grupo para localizar las copias.")
    b.pagebreak()

    emit(b, PROFILE)
    b.pagebreak()

    b.h1("Funciones a las que NO tiene acceso")
    b.body("Su rol no incluye las funciones de la siguiente tabla. Si intenta ingresar a esas secciones, el sistema mostrará el mensaje \"No tienes acceso\" y no abrirá la página:")
    b.table([
        ["Función / Módulo", "Disponible para", "Comportamiento con su rol"],
        ["Usuarios (crear, editar, eliminar, restablecer)", "Solo Administrador", "Menú oculto."],
        ["Reportes (crear, generar, descargar, eliminar)", "Administrador, Dirección y Dirección Médica", "Menú oculto."],
        ["Listado Diario de Cirugías (armar y guardar)", "Administrador, Dirección y Dirección Médica", "Menú oculto."],
        ["Estatus Cirugía (asignar/cambiar estatus)", "Administrador, Dirección y Dirección Médica", "Menú oculto."],
        ["Editar expedientes de otros médicos", "Solo su propio creador", "El sistema rechaza el cambio."],
        ["Eliminar expedientes", "Administrador, Dirección y Dirección Médica", "El botón no está disponible."],
        ["Cambiar el estatus de cirugía de un expediente", "Administrador, Dirección y Dirección Médica", "El sistema rechaza el cambio."],
        ["Administrar especialidades y localidades", "Solo Administrador", "Botones no disponibles."],
        ["Cambiar contraseñas de otros usuarios", "Solo Administrador", "Sin acceso a Usuarios."],
    ], [5.6 * cm, 4.4 * cm, 5.0 * cm])
    b.spacer(0.6)
    b.h1("Preguntas frecuentes")
    b.quote("¿Puedo editar un expediente que creó otro médico?")
    b.body("No. Solo puede editar los expedientes que usted creó. Para corregir un expediente de otro médico, comuníquese con la Dirección Médica o el Administrador.")
    b.quote("¿Puedo eliminar un expediente?")
    b.body("No. La eliminación de expedientes corresponde al Administrador, la Dirección y la Dirección Médica.")
    b.quote("¿Por qué no veo Reportes ni Listados en mi menú?")
    b.body("Esos módulos son de Administración, Dirección y Dirección Médica. Su rol (Médico) solo utiliza Expedientes, Mi Perfil e Inicio.")
    b.quote("¿Puedo cambiar el estatus de cirugía?")
    b.body("No. El estatus de cirugía solo lo cambian el Administrador, la Dirección y la Dirección Médica.")
    b.quote("¿Qué hago si cometí un error al crear un expediente?")
    b.body("Si el expediente es suyo, puede editarlo. Si necesita eliminarlo o corregir un expediente de otro médico, solicite la ayuda a la Dirección Médica o al Administrador.")
    b.quote("¿El teléfono es obligatorio en el perfil?")
    b.body("Sí, junto con el nombre completo. El formato es 0000-0000 y el sistema valida que lo cumpla.")
    b.pagebreak()

    emit(b, RECOMMEND)
    b.build()


def emit(b, items, **fmt):
    for it in items:
        kind = it[0]
        if kind == "h1":
            b.h1(it[1].format(**fmt))
        elif kind == "h2":
            b.h2(it[1].format(**fmt))
        elif kind == "body":
            b.body(it[1].format(**fmt))
        elif kind == "note":
            b.note(it[1].format(**fmt))
        elif kind == "bullet":
            b.bullet(it[1].format(**fmt))
        elif kind == "numbered":
            b.numbered(it[1].format(**fmt))
        elif kind == "quote":
            b.quote(it[1].format(**fmt))
        elif kind == "table":
            b.table(it[1], it[2])


# ---------------------------------------------------------------------------
# Acuerdo Marco
# ---------------------------------------------------------------------------
def acuerdo_marco(out_dir, version="1.1"):
    b = DocBuilder(os.path.join(out_dir, "Acuerdo_Marco_Sistema_Expedientes_SBJ.pdf"),
                   "Centro Médico San Benito José",
                   "Documento legal - Sistema de Expedientes", version)
    b.legal_cover([
        "CENTRO MÉDICO SAN BENITO JOSÉ",
        "Acuerdo Marco y Anexo de Protección de Datos",
        "Desarrollo, Titularidad y Uso del Sistema Web de Gestión de Expedientes Médicos",
    ], version)

    b.h1("Introducción")
    b.body("El presente documento formaliza la relación entre el Centro Médico San Benito José (en adelante, \"el Centro\") y TurtleLite (en adelante, \"el Desarrollador\") respecto del Sistema Web de Gestión de Expedientes Médicos, y regula el tratamiento de los datos personales de salud que dicho sistema administra.")
    b.pagebreak()

    b.h1("PARTE I - Contrato de desarrollo y cesión de derechos")
    b.h2("Artículo 1. Partes")
    b.body("1.1 Contratante: Centro Médico San Benito José, con domicilio en Comayagua, Comayagua, frente al Convento de las Hermanas Clarisas, representado legalmente por Alexander James Scheibner, ciudadano(a) estadounidense, portador(a) de carnet de residencia en Honduras número 01-1812-2019-02366.")
    b.body("1.2 Desarrollador: TurtleLite, persona natural, representado por Amed Enmanuel Canales Mejía, portador(a) de identidad 0318-2008-01133.")

    b.h2("Artículo 2. Objeto")
    b.body("2.1 El Desarrollador ha construido y entregado el Sistema Web de Gestión de Expedientes Médicos (sitio web, aplicación de backend, base de datos y documentación), cuya función es registrar y administrar expedientes de pacientes, generar reportes, gestionar listados diarios de cirugías, controlar el estatus quirúrgico y administrar usuarios con roles de acceso.")
    b.body("2.2 El sistema incluye, entre otras funcionalidades: registro de expedientes con número único automático en formato numérico; asignación de criticidad clínica (Baja, Media o Alta); domicilio desglosado por departamento, municipio y localidad; búsqueda de expedientes sin distinción de mayúsculas ni tildes; reportes exportables a Excel con filtros por especialidad, perfil, criticidad y estatus de cirugía; reordenamiento de reportes con la columna No fija (los números 1, 2, 3... indican la posición del registro y no se mueven al reordenar); listados diarios de cirugías por fecha; y control del estatus de cirugía con observaciones.")

    b.h2("Artículo 3. Titularidad del software")
    b.body("3.1 El Desarrollador cede al Centro el uso pleno, permanente e irrevocable del sistema y de su código fuente, incluyendo el derecho a modificarlo, adaptarlo y desplegarlo en la infraestructura que el Centro elija.")
    b.body("3.2 El Desarrollador conserva el crédito de autoría (\"© TurtleLite\") en la interfaz y en la documentación, sin que ello limite los derechos de uso del Centro.")
    b.body("3.3 El Centro es el único responsable del uso del sistema y de las decisiones que se tomen con base en la información que este administra.")

    b.h2("Artículo 4. Titularidad de los datos")
    b.body("4.1 Toda la información ingresada al sistema (expedientes, identidades, diagnósticos, listados y reportes) es propiedad exclusiva del Centro.")
    b.body("4.2 El Desarrollador no utilizará, reproducirá ni divulgará dicha información, ni durante la vigencia de este acuerdo ni con posterioridad a su terminación.")

    b.h2("Artículo 5. Confidencialidad (NDA)")
    b.body("5.1 El Desarrollador se obliga a mantener bajo estricta confidencialidad toda la información clínica de los pacientes, las credenciales de acceso, las contraseñas y los detalles técnicos de la infraestructura a los que tenga acceso en razón del presente acuerdo.")
    b.body("5.2 Dicha información solo podrá utilizarse para cumplir el objeto del contrato y no podrá divulgarse a terceros, salvo requerimiento de autoridad competente debidamente notificado o autorización escrita del Centro.")
    b.body("5.3 La obligación de confidencialidad subsiste de forma indefinida después de la terminación del acuerdo y se extiende a cualquier persona que preste servicios al Desarrollador.")
    b.pagebreak()

    b.h2("Artículo 6. Mantenimiento y soporte")
    b.body("6.1 El Desarrollador prestará servicio de corrección de errores y actualizaciones por el período que las partes acuerden por escrito (el alcance y la duración del soporte se definirán en un anexo posterior).")
    b.body("6.2 El Desarrollador realizará cualquier edición al sistema, ya sea por corrección de errores o nuevas funcionalidades.")

    b.h2("Artículo 7. Responsabilidades")
    b.body("7.1 El Desarrollador responderá únicamente por errores de programación imputables al código entregado.")
    b.body("7.2 El Centro es responsable de la veracidad y licitud de los datos ingresados y de mantener las credenciales de acceso seguras y confidenciales.")

    b.h2("Artículo 8. Terminación y entrega")
    b.body("8.1 Al terminar la relación por cualquier causa, el Desarrollador entregará al Centro el código fuente actualizado y las cuentas donde funciona el sistema.")

    b.h2("Artículo 9. Vigencia y firma")
    b.body("9.1 El presente acuerdo entra en vigencia a partir de la firma de ambas partes y permanece vigente mientras el Centro utilice el sistema.")
    b.spacer(1.2)
    b.table([
        ["Firma y fecha: ____________________", "Firma y fecha: ____________________"],
        ["Alexander James Scheibner", "Amed Enmanuel Canales Mejía"],
        ["Representante legal", "Desarrollador"],
    ], [8.3 * cm, 8.3 * cm], header=False)
    b.pagebreak()

    b.h1("PARTE II - Anexo de protección de datos personales de salud")
    b.h2("Artículo 10. Base legal")
    b.body("10.1 El tratamiento de los expedientes médicos se realiza conforme al derecho a la intimidad y al hábeas data reconocidos en los artículos 76 y 182 numeral 2 de la Constitución de la República de Honduras, al deber de secreto profesional establecido en el Código de Salud y a las disposiciones sobre datos personales de la Ley de Transparencia y Acceso a la Información Pública (Decreto 170-2006). Honduras se encuentra en proceso de discusión de una ley integral de protección de datos personales, por lo que las partes adoptan en este documento estándares de protección equivalentes a los internacionales, y se obligan a ajustar el tratamiento de los datos a dicha ley cuando sea aprobada. La divulgación de secretos profesionales o de datos de salud está sancionada en los artículos 274 y 276 del Código Penal (Decreto 130-2017). El artículo 18 del Código de Ética del Colegio Médico de Honduras prohíbe que los sistemas de informática médica comprometan la intimidad del paciente sin su consentimiento.")

    b.h2("Artículo 11. Responsable del tratamiento")
    b.body("11.1 El responsable del tratamiento de los datos es el Centro Médico San Benito José.")
    b.body("11.2 El Desarrollador actúa únicamente como encargado del tratamiento (administración técnica del sistema), con acceso restringido a los datos.")

    b.h2("Artículo 12. Finalidad del tratamiento")
    b.body("12.1 Los datos personales de salud se recolectan exclusivamente para: atención y registro médico de los pacientes; elaboración de expedientes, reportes estadísticos y listados diarios de cirugías; asignación de criticidad clínica; y seguimiento del estatus quirúrgico.")

    b.h2("Artículo 13. Principios aplicables")
    b.bullet("<b>Consentimiento:</b> los pacientes autorizan el registro de sus datos al momento de su atención.")
    b.bullet("<b>Finalidad:</b> los datos se usan únicamente para los fines declarados.")
    b.bullet("<b>Proporcionalidad:</b> solo se registran los datos estrictamente necesarios.")
    b.bullet("<b>Seguridad:</b> el acceso está limitado por roles (Administrador, Dirección, Dirección Médica y Médico), cada uno con permisos específicos, incluidas reglas sobre creación, edición y eliminación de expedientes.")
    b.bullet("<b>Confidencialidad:</b> el personal del Centro está obligado a guardar secreto sobre la información de los pacientes, incluso después de dejar de laborar en el Centro.")

    b.h2("Artículo 14. Derechos de los pacientes")
    b.body("Todo paciente o su representante legal podrá ejercer los derechos de acceso, rectificación, cancelación y oposición (ARCO) sobre sus datos, mediante solicitud escrita presentada al Centro.")

    b.h2("Artículo 15. Medidas de seguridad técnicas")
    b.bullet("Autenticación con usuario y contraseña para todos los usuarios.")
    b.bullet("Roles de acceso que limitan qué puede ver, crear, editar o eliminar cada usuario.")
    b.bullet("Respaldos periódicos de la base de datos realizados por el Centro.")
    b.bullet("Registro y control de usuarios activos e inactivos.")
    b.bullet("Número de expediente único, automático y en formato numérico, asignado por el sistema.")
    b.bullet("El sistema no recopila información fuera de la finalidad declarada.")

    b.h2("Artículo 16. Conservación y eliminación")
    b.body("16.1 Los expedientes se conservarán conforme a la normativa aplicable a archivos médicos. La eliminación de datos solo podrá realizarla personal autorizado y bajo procedimiento documentado.")

    b.h2("Artículo 17. Modificaciones a este anexo")
    b.body("17.1 Las funcionalidades del sistema pueden evolucionar mediante actualizaciones periódicas; dichas actualizaciones no modificarán las garantías de confidencialidad, seguridad y finalidad establecidas en el presente anexo.")

    b.build()


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    out_dir = "docs"
    if "--out" in sys.argv:
        out_dir = sys.argv[sys.argv.index("--out") + 1]
    os.makedirs(out_dir, exist_ok=True)
    manual_direccion(out_dir)
    manual_direccion_medica(out_dir)
    manual_medico(out_dir)
    acuerdo_marco(out_dir)
    print("PDFs generados en:", os.path.abspath(out_dir))
