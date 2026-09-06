use tauri::{
    menu::MenuBuilder,
    tray::TrayIconBuilder,
    Emitter,
    Manager,
};

fn setup_tray_menu(app: &mut tauri::App) -> tauri::Result<()> {
    let menu = MenuBuilder::new(app)
        .text("show-idle", "切到待机")
        .text("show-work", "切到工作")
        .text("show-eat", "切到吃饭")
        .separator()
        .text("open-settings", "设置…")
        .separator()
        .text("pause-reminders", "暂停提醒")
        .text("resume-reminders", "恢复提醒")
        .separator()
        .text("quit", "退出 Booch")
        .build()?;

    let mut tray_builder = TrayIconBuilder::new()
        .tooltip("Booch Desktop Pet")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
            if event.id() == "show-idle" {
                let _ = app.emit("pet-state-requested", "idle");
            } else if event.id() == "show-work" {
                let _ = app.emit("pet-state-requested", "work");
            } else if event.id() == "show-eat" {
                let _ = app.emit("pet-state-requested", "eat");
            } else if event.id() == "open-settings" {
                let _ = app.emit("settings-panel-requested", true);
            } else if event.id() == "pause-reminders" {
                let _ = app.emit("reminders-paused-changed", true);
            } else if event.id() == "resume-reminders" {
                let _ = app.emit("reminders-paused-changed", false);
            } else if event.id() == "quit" {
                app.exit(0);
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(icon);
    }

    let tray = tray_builder.build(app)?;
    app.manage(tray);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            setup_tray_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Booch Desktop Pet");
}
