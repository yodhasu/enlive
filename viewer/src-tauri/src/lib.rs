use tauri::Manager;

#[tauri::command]
fn get_server_url() -> String {
    std::env::var("ENLIVE_SERVER_URL").unwrap_or_else(|_| "http://127.0.0.1:7500".to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_server_url])
        .run(tauri::generate_context!())
        .expect("error while running Enlive Viewer");
}
