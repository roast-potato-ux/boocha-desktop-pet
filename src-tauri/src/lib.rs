use tauri::{
    menu::MenuBuilder,
    tray::TrayIconBuilder,
    Emitter,
    Manager,
};

/// Remove every vibrancy view `window_vibrancy` has added to this window.
///
/// `apply_vibrancy` pushes a fresh tagged `NSVisualEffectView` on *every* call,
/// and the settings panel re-applies the glass whenever it opens — so several
/// stacked views can pile up. `clear_vibrancy` only removes one of them, which
/// leaves the leftover glass stuck on after closing the settings panel (the
/// ghost "background board"). Loop until nothing is left.
#[cfg(target_os = "macos")]
fn clear_all_vibrancy(window: &tauri::WebviewWindow) -> Result<(), String> {
    let win = window.clone();

    window
        .run_on_main_thread(move || {
            for _ in 0..32 {
                match window_vibrancy::clear_vibrancy(&win) {
                    Ok(true) => continue,
                    _ => break,
                }
            }
        })
        .map_err(|e| e.to_string())
}

#[cfg(not(target_os = "macos"))]
fn clear_all_vibrancy(_window: &tauri::WebviewWindow) -> Result<(), String> {
    Ok(())
}

/// Toggle the macOS native window vibrancy behind the settings panel.
///
/// We can't rely on `clearEffects()` from the JS side: in Tauri 2.11.5 that
/// command maps to `set_effects(null)`, whose `else` branch only clears effects
/// on Windows. On macOS it is a silent no-op, so we clear through
/// `window_vibrancy::clear_vibrancy()` ourselves instead.
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
        clear_all_vibrancy(&window)?;
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
        .text("quit", "退出 Boocha")
        .build()?;

    let mut tray_builder = TrayIconBuilder::new()
        .tooltip("Boocha Desktop Pet")
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
        // Only let the window-state plugin remember WHERE the pet window was.
        // Its SIZE restore actively breaks the layout: it fires after the
        // frontend's setSize() and re-applies a stale physical size saved by an
        // older build (e.g. 220px-wide), clipping the quick-action buttons.
        // The window size is fully owned by the frontend (settings.scale).
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::POSITION
                        | tauri_plugin_window_state::StateFlags::VISIBLE
                        | tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![set_panel_vibrancy])
        .setup(|app| {
            setup_tray_menu(app)?;

            // Drop any glass the window may still carry from a previous run —
            // e.g. the dev server hot-reloaded while the settings panel was open,
            // so nothing ever got the chance to clear it.
            if let Some(window) = app.get_webview_window("main") {
                let _ = clear_all_vibrancy(&window);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Boocha Desktop Pet");
}
