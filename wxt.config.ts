import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "CleanTabs",
    description: "按规则自动休眠或关闭标签页。",
    permissions: ["storage", "tabs", "alarms", "tabGroups"],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000; object-src 'self';",
    },
    web_accessible_resources: [
      {
        resources: ["lib/*"],
        matches: ["<all_urls>"],
      },
    ],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Alt+T",
          mac: "MacCtrl+T",
        },
        description: "打开弹出窗口",
      },
    },
  },
})
