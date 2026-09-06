use tauri::{
    menu::MenuBuilder,
    tray::TrayIconBuilder,
    Emitter,
    Manager,
};

/// Toggle the macOS native window vibrancy behind the settings panel.
///
/// We can't rely on `clearEffects()` from the JS side: in Tauri 2.11.5 that
/// command maps to `set_effects(null)`, whose `else` branch only clears effects
/// on Windows. On macOS it is a silent no-op, so the popover vibrancy applied
/// while the settings panel is open would stick around forever (the ghost
/// "background board" you saw after closing settings). We expose our own
/// command that calls `window_vibrancy::clear_vibrancy()` directly.
#[tauri::command]
fn set_panel_vibrancy(window: tauri::WebviewWindow, enabled: bool) -> Result<(), String> {
    if enabled {
        window
            .set_effects(
                tauri::window::EffectsBuilder::new()
                    .effect(tauri::window::Effect::Popover)
                    .state(tauri::window::EffectState::Active)
                    .radius(18.0)
                    .build(),
            )
            .map_err(|e| e.to_string())?;
    } else {
        #[cfg(target_os = "macos")]
        {
            let win = window.clone();
            window
                .run_on_main_thread(move || {
                    let _ = window_vibrancy::clear_vibrancy(&win);
                })
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

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
        .invoke_handler(tauri::generate_handler![set_panel_vibrancy])
        .setup(|app| {
            setup_tray_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Booch Desktop Pet");
}
