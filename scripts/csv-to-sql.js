import { readFileSync, writeFileSync } from "node:fs";

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0) || rows.length > 0) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("El CSV termina dentro de un campo entrecomillado.");
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Uso: node scripts/csv-to-sql.js <personas.csv> <personas.sql>");
  process.exitCode = 1;
} else {
  try {
    const source = readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
    const rows = parseCsv(source);
    const headers = rows.shift()?.map((header) => header.trim().toLowerCase());
    const columns = ["id", "nombre", "puesto"];
    if (!headers || columns.some((column) => headers.filter((header) => header === column).length !== 1)) {
      throw new Error("El CSV debe incluir una sola columna para cada encabezado: id, nombre y puesto.");
    }

    const indexes = columns.map((column) => headers.indexOf(column));
    const statements = rows.map((values, rowIndex) => {
      if (values.length !== headers.length) {
        throw new Error(`La fila ${rowIndex + 2} tiene ${values.length} campos; se esperaban ${headers.length}.`);
      }
      const [id, nombre, puesto] = indexes.map((columnIndex) => values[columnIndex].trim());
      if (!/^[1-9]\d*$/.test(id) || !nombre || !puesto) {
        throw new Error(`La fila ${rowIndex + 2} debe tener un ID positivo, nombre y puesto.`);
      }
      return `INSERT INTO persona (id, nombre, puesto) VALUES (${id}, ${sqlString(nombre)}, ${sqlString(puesto)});`;
    });

    writeFileSync(outputPath, `BEGIN TRANSACTION;\n${statements.join("\n")}\nCOMMIT;\n`, "utf8");
    console.log(`Se generaron ${statements.length} registros en ${outputPath}.`);
  } catch (error) {
    console.error(`No se pudo convertir el CSV: ${error.message}`);
    process.exitCode = 1;
  }
}
