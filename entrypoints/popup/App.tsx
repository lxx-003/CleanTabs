import { useContext, useState } from "react"
import { RefreshCw } from "lucide-react"

import { sendMessage } from "webext-bridge/popup"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Stash } from "@/components/stash"
import Rules from "@/components/Rules"
import { Switch } from "@/components/ui/switch"
import { AppStateContext } from "@/components/Providers"

import logo from "/logo.png"
import { Settings } from "@/components/settings"
import { Tabs as TabsComp } from "@/components/tabs"
import { Button } from "@/components/ui/button"
import { ChromeSettingsIcon } from "@/components/icons"

const TabNames = ["标签页", "规则", "暂存箱"]

function App() {
  const { enabled, setEnabled } = useContext(AppStateContext)

  const [running, setRunning] = useState(false)

  return (
    <div className="clean-tabs-shell min-w-[800px] min-h-[430px] w-full h-full">
      <Tabs defaultValue={TabNames[0]} className="clean-tabs-surface w-full h-full">
        <TabsList className="clean-header w-full">
          <div className="clean-header-left">
            <div className="clean-brand" title="CleanTabs">
              <span className="clean-logo-frame">
                <img src={logo} className="h-5 w-5" />
              </span>
              <span className="clean-brand-text">CleanTabs</span>
            </div>
            <div className="clean-status-cluster">
              <Switch
                className="clean-switch"
                checked={enabled}
                onCheckedChange={setEnabled}
                title={"全局开关：" + (enabled ? "开启" : "关闭")}
              />
              <span
                className={
                  enabled
                    ? "clean-status-pill clean-status-pill-on"
                    : "clean-status-pill clean-status-pill-off"
                }
              >
                {enabled ? "运行中" : "已暂停"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="clean-icon-button"
              title="立即执行规则"
              onClick={async () => {
                if (running) return

                setRunning(true)
                const res = await sendMessage("run-cron", {}, "background")
                console.log(res)
                setTimeout(() => setRunning(false), 1000)
              }}
            >
              <RefreshCw className={running ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="clean-nav">
            {TabNames.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="clean-nav-trigger"
              >
                {t}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="Settings"
              className="clean-settings-trigger"
              title="设置"
            >
              <ChromeSettingsIcon className="w-4 h-4" />
            </TabsTrigger>
          </div>
        </TabsList>
        <TabsContent value="标签页" className="clean-panel">
          <TabsComp />
        </TabsContent>
        <TabsContent value="规则" className="clean-panel">
          <Rules />
        </TabsContent>
        <TabsContent value="暂存箱" className="clean-panel">
          <Stash />
        </TabsContent>
        <TabsContent value="Settings" className="clean-panel">
          <Settings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default App
