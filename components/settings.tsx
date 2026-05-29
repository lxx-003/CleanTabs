import { useContext } from "react"
import { AppStateContext } from "./Providers"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import logo from "/logo.png"
import { browser } from "wxt/browser"
import { ChromeStore, GitHub } from "./icons"

export function Settings() {
  const { settings, setSettings } = useContext(AppStateContext)

  return (
    <div className="settings-grid">
      <div className="settings-main">
        <h1 className="settings-title">设置</h1>
        <div>
          <div className="setting-row">
            <Label htmlFor="ClosePinTab" className="setting-label">
              允许关闭固定标签页
            </Label>
            <Switch
              id="ClosePinTab"
              className="clean-switch"
              checked={settings.ClosePinTab}
              onCheckedChange={(checked) => {
                setSettings(
                  {
                    ...settings,
                    ClosePinTab: checked,
                  },
                  { toStorage: true }
                )
              }}
            />
          </div>

          <div className="setting-row">
            <Label htmlFor="CloseTabInGroup" className="setting-label">
              允许关闭标签组内的标签页
            </Label>
            <Switch
              id="CloseTabInGroup"
              className="clean-switch"
              checked={settings.CloseTabInGroup}
              onCheckedChange={(checked) => {
                setSettings(
                  {
                    ...settings,
                    CloseTabInGroup: checked,
                  },
                  { toStorage: true }
                )
              }}
            />
          </div>
        </div>
      </div>

      <div className="about-panel">
        <img src={logo} className="about-logo" />
        <h1 className="about-title">CleanTabs</h1>
        <p className="about-version">版本 {browser.runtime.getManifest().version}</p>
        <div className="about-links">
          <a
            href="https://github.com/heyppen/CleanTabs"
            title="https://github.com/heyppen/CleanTabs"
            target="_blank"
            className="about-link"
          >
            <GitHub className="inline-block w-5 h-5" />
          </a>
          <a
            href="https://chromewebstore.google.com/detail/cleantabs/dhafadjcaeeklhlbbfeomgdgpkafdmig"
            title="Chrome 网上应用店链接"
            target="_blank"
            className="about-link"
          >
            <ChromeStore className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  )
}
