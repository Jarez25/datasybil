use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::models::ConnectionConfig;

fn get_config_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Error obteniendo directorio de configuración: {}", e))?;
    Ok(dir.join("connections.json"))
}

pub async fn load_connections(app: &AppHandle) -> Result<Vec<ConnectionConfig>, String> {
    let file_path = get_config_file_path(app)?;
    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let bytes = tokio::fs::read(&file_path)
        .await
        .map_err(|e| format!("Error leyendo archivo de conexiones: {}", e))?;

    let configs: Vec<ConnectionConfig> = serde_json::from_slice(&bytes)
        .unwrap_or_default();

    Ok(configs)
}

pub async fn save_connection(app: &AppHandle, config: ConnectionConfig) -> Result<(), String> {
    let file_path = get_config_file_path(app)?;
    if let Some(parent) = file_path.parent() {
        let _ = tokio::fs::create_dir_all(parent).await;
    }

    let mut configs = load_connections(app).await.unwrap_or_default();

    // Reemplaza si ya existe el ID, o inserta nuevo
    if let Some(idx) = configs.iter().position(|c| c.id == config.id) {
        configs[idx] = config;
    } else {
        configs.push(config);
    }

    let json_bytes = serde_json::to_vec_pretty(&configs)
        .map_err(|e| format!("Error serializando conexiones: {}", e))?;

    tokio::fs::write(&file_path, json_bytes)
        .await
        .map_err(|e| format!("Error guardando archivo de conexiones: {}", e))?;

    Ok(())
}

pub async fn delete_connection(app: &AppHandle, id: &str) -> Result<(), String> {
    let file_path = get_config_file_path(app)?;
    let mut configs = load_connections(app).await.unwrap_or_default();

    configs.retain(|c| c.id != id);

    let json_bytes = serde_json::to_vec_pretty(&configs)
        .map_err(|e| format!("Error serializando conexiones: {}", e))?;

    tokio::fs::write(&file_path, json_bytes)
        .await
        .map_err(|e| format!("Error guardando archivo de conexiones: {}", e))?;

    Ok(())
}
