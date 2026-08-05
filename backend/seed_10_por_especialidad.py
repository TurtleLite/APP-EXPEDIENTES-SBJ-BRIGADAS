"""Agrega expedientes por especialidad (hasta 10 por cada una) con todos los campos
del formulario de creación de expedientes llenos y en el formato correcto.
Es idempotente: solo inserta los faltantes para completar 10 por especialidad."""
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.list_definition import ListDefinition, ListRecord
from seed_expedientes import (
    ESPECIALIDADES, NOMBRES_M, NOMBRES_F, APELLIDOS, RESPONSABLES_M, RESPONSABLES_F,
    DOMICILIOS, MEDICOS, ENFERMEDADES_PREVIAS, CIRUGIAS_PREVIAS,
    ALERGIAS, OTROS_ANTECEDENTES, diagnostico_historia, examen_fisico_por_diag,
    gen_peso_talla, gen_identidad, gen_tel,
)

random.seed(7)
POR_ESPECIALIDAD = 10

EXTRA_ESPECIALIDADES = {
    "ORTOPEDIA": {
        "diagnosticos": ESPECIALIDADES["Ortopedia y Traumatología"]["diagnosticos"],
        "edades": ESPECIALIDADES["Ortopedia y Traumatología"]["edades"],
        "quirurgica": True,
    },
}


def _count_por_especialidad(db: Session, list_id: int) -> dict:
    recs = db.query(ListRecord).filter(ListRecord.list_definition_id == list_id).all()
    counts: dict = {}
    for r in recs:
        esp = (r.data or {}).get("especialidad", "") or ""
        counts[esp] = counts.get(esp, 0) + 1
    return counts


def main():
    db = SessionLocal()
    try:
        exp = db.query(ListDefinition).filter(ListDefinition.is_system == True).first()
        if not exp:
            print("No existe la lista sistema 'Expediente Médico'")
            return
        actual = _count_por_especialidad(db, exp.id)
        total_antes = sum(actual.values())
        print(f"Expedientes actuales: {total_antes}")

        records = []
        idx = total_antes
        especialidades = dict(ESPECIALIDADES)
        especialidades.update({k: v for k, v in EXTRA_ESPECIALIDADES.items() if k not in ESPECIALIDADES})
        for esp, cfg in especialidades.items():
            faltantes = POR_ESPECIALIDAD - actual.get(esp.upper(), 0)
            for i in range(max(0, faltantes)):
                idx += 1
                sexo = "F" if esp == "Ginecología y Obstetricia" else random.choice(["M", "F"])
                if esp == "Urología":
                    sexo = random.choice(["M", "F"])
                edad = random.randint(*cfg["edades"])
                if sexo == "F":
                    nombre = random.choice(NOMBRES_F)
                    responsable = random.choice(RESPONSABLES_F)
                else:
                    nombre = random.choice(NOMBRES_M)
                    responsable = random.choice(RESPONSABLES_M)
                apellido = random.choice(APELLIDOS)
                apellido2 = random.choice(APELLIDOS)
                diag = random.choice(cfg["diagnosticos"])
                historia = diagnostico_historia(diag)
                peso, talla, bmi = gen_peso_talla(edad)
                perfil = str((i % 4) + 1)
                criticidad = random.choice(["Baja", "Media", "Alta"])
                fecha_elab = (date.today() - timedelta(days=random.randint(1, 180))).isoformat()
                fecha_cirugia = (date.today() + timedelta(days=random.randint(7, 90))).isoformat()

                data = {
                    "especialidad": esp.upper(),
                    "criticidad": criticidad,
                    "estatus": perfil,
                    "nombre": nombre,
                    "apellido": f"{apellido} {apellido2}",
                    "sexo": sexo,
                    "edad": f"{edad} a",
                    "fecha_elaboracion": fecha_elab,
                    "identidad": gen_identidad(edad, sexo, idx),
                    "persona_responsable": responsable,
                    "albergue": "Si" if random.random() < 0.25 else "No",
                    "perfil": perfil,
                    "telefono": gen_tel(),
                    "telefono2": gen_tel() if random.random() < 0.3 else "",
                    "telefono3": "",
                    "expediente": f"{idx:04d}",
                    "domicilio": random.choice(DOMICILIOS),
                    "historia_enfermedad": historia,
                    "enfermedades_previas": random.choice(ENFERMEDADES_PREVIAS),
                    "cirugias_previas": random.choice(CIRUGIAS_PREVIAS),
                    "alergias": random.choice(ALERGIAS),
                    "otros_antecedentes": random.choice(OTROS_ANTECEDENTES),
                    "presion_arterial": random.choice(["110/70", "120/80", "130/85", "140/90", "150/95"]),
                    "fc": str(random.randint(60, 100)),
                    "pulso": str(random.randint(60, 100)),
                    "temperatura": str(random.choice(["36.5", "36.8", "37.0", "37.5", "38.0", "38.5"])),
                    "fr": str(random.randint(14, 24)),
                    "peso": peso,
                    "talla": talla,
                    "bmi": bmi,
                    "examen_fisico": examen_fisico_por_diag(diag),
                    "diagnostico": diag,
                    "nombre_medico": random.choice(MEDICOS),
                    "estatus_cirugia": "En espera",
                    "cirujano": "",
                    "fecha_cirugia": fecha_cirugia,
                }
                records.append(data)

        for data in records:
            db.add(ListRecord(list_definition_id=exp.id, data=data, created_by=exp.created_by))
        db.commit()

        nuevo = _count_por_especialidad(db, exp.id)
        total = sum(nuevo.values())
        print(f"Se insertaron {len(records)} expedientes (completando 10 por especialidad). Total ahora: {total}")
        for esp, n in sorted(nuevo.items()):
            print(f"  {esp}: {n}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
