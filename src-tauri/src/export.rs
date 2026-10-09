use crate::models::ColumnInfo;
use serde_json::Value;

pub async fn export_results_dialog(
    default_name: &str,
    format_type: &str, // "csv" | "excel"
    columns: &[ColumnInfo],
    rows: &[Vec<Value>],
) -> Result<Option<String>, String> {
    let mut dialog = rfd::AsyncFileDialog::new()
        .set_title("Guardar consulta como...")
        .set_file_name(default_name);

    if format_type == "excel" {
        dialog = dialog
            .add_filter("Libro de Excel (*.xls, *.csv)", &["xls", "csv"])
            .add_filter("Todos los archivos (*.*)", &["*"]);
    } else {
        dialog = dialog
            .add_filter("Archivo CSV (*.csv)", &["csv"])
            .add_filter("Todos los archivos (*.*)", &["*"]);
    }

    let file_handle = dialog.save_file().await;
    let file_path = match file_handle {
        Some(h) => h.path().to_path_buf(),
        None => return Ok(None),
    };

    let extension = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let bytes = if extension == "xls" || (format_type == "excel" && extension != "csv") {
        generate_excel_xml(columns, rows)
    } else {
        generate_csv_bytes(columns, rows)
    };

    tokio::fs::write(&file_path, bytes)
        .await
        .map_err(|e| format!("Error guardando archivo: {}", e))?;

    Ok(Some(file_path.to_string_lossy().to_string()))
}

fn generate_csv_bytes(columns: &[ColumnInfo], rows: &[Vec<Value>]) -> Vec<u8> {
    let mut content = String::new();
    // UTF-8 BOM for Microsoft Excel compatibility
    content.push('\u{FEFF}');

    // Headers
    let header_line = columns
        .iter()
        .map(|c| format!("\"{}\"", c.name.replace('"', "\"\"")))
        .collect::<Vec<_>>()
        .join(",");
    content.push_str(&header_line);
    content.push_str("\r\n");

    // Rows
    for row in rows {
        let row_line = row
            .iter()
            .map(|cell| match cell {
                Value::Null => "".to_string(),
                Value::Bool(b) => if *b { "TRUE".to_string() } else { "FALSE".to_string() },
                Value::Number(n) => n.to_string(),
                Value::String(s) => format!("\"{}\"", s.replace('"', "\"\"")),
                Value::Array(_) | Value::Object(_) => {
                    format!("\"{}\"", cell.to_string().replace('"', "\"\""))
                }
            })
            .collect::<Vec<_>>()
            .join(",");
        content.push_str(&row_line);
        content.push_str("\r\n");
    }

    content.into_bytes()
}

fn generate_excel_xml(columns: &[ColumnInfo], rows: &[Vec<Value>]) -> Vec<u8> {
    let mut xml = String::new();
    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<?mso-application progid=\"Excel.Sheet\"?>\n");
    xml.push_str("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"\n");
    xml.push_str(" xmlns:o=\"urn:schemas-microsoft-com:office:office\"\n");
    xml.push_str(" xmlns:x=\"urn:schemas-microsoft-com:office:excel\"\n");
    xml.push_str(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">\n");
    xml.push_str(" <Styles>\n");
    xml.push_str("  <Style ss:ID=\"Header\">\n");
    xml.push_str("   <Font ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/>\n");
    xml.push_str("   <Interior ss:Color=\"#107C41\" ss:Pattern=\"Solid\"/>\n");
    xml.push_str("  </Style>\n");
    xml.push_str(" </Styles>\n");
    xml.push_str(" <Worksheet ss:Name=\"Resultados\">\n");
    xml.push_str("  <Table>\n");

    // Header Row
    xml.push_str("   <Row ss:StyleID=\"Header\">\n");
    for col in columns {
        xml.push_str(&format!(
            "    <Cell><Data ss:Type=\"String\">{}</Data></Cell>\n",
            xml_escape(&col.name)
        ));
    }
    xml.push_str("   </Row>\n");

    // Data Rows
    for row in rows {
        xml.push_str("   <Row>\n");
        for cell in row {
            match cell {
                Value::Null => {
                    xml.push_str("    <Cell><Data ss:Type=\"String\"></Data></Cell>\n");
                }
                Value::Number(n) => {
                    xml.push_str(&format!(
                        "    <Cell><Data ss:Type=\"Number\">{}</Data></Cell>\n",
                        n
                    ));
                }
                Value::Bool(b) => {
                    xml.push_str(&format!(
                        "    <Cell><Data ss:Type=\"String\">{}</Data></Cell>\n",
                        if *b { "TRUE" } else { "FALSE" }
                    ));
                }
                Value::String(s) => {
                    xml.push_str(&format!(
                        "    <Cell><Data ss:Type=\"String\">{}</Data></Cell>\n",
                        xml_escape(s)
                    ));
                }
                Value::Array(_) | Value::Object(_) => {
                    xml.push_str(&format!(
                        "    <Cell><Data ss:Type=\"String\">{}</Data></Cell>\n",
                        xml_escape(&cell.to_string())
                    ));
                }
            }
        }
        xml.push_str("   </Row>\n");
    }

    xml.push_str("  </Table>\n");
    xml.push_str(" </Worksheet>\n");
    xml.push_str("</Workbook>\n");

    xml.into_bytes()
}

fn xml_escape(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
