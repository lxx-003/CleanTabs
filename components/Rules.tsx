import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircleHelp, CodeXml, Table } from "lucide-react"
import { useState } from "react"
import RulesTable from "./rules-table"
import RulesEditor from "./rules-editor"

export default function Rules() {
  const [tab, setTab] = useState<string>("table")

  return (
    <div className="view-stack">
      <Tabs value={tab} onValueChange={setTab} className="view-stack">
        <div className="view-toolbar">
          <div className="view-toolbar-left">
            <TabsList className="mode-toggle">
              <TabsTrigger
                value="table"
                className="mode-trigger"
                title="表格模式"
              >
                <Table className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className="mode-trigger"
                title="代码模式"
              >
                <CodeXml className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </div>
          <Popover>
            <PopoverTrigger className="help-icon-button" title="规则说明">
              <CircleHelp className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-[400px]">
              {tab === "table" ? (
                <div className="text-sm leading-7">
                  <h1 className="font-bold text-base mb-2">规则</h1>
                  <ul className="list-disc list-inside">
                    <li>
                      URL 匹配模式：
                      <a
                        className="text-primary underline"
                        href="https://github.com/heyppen/CleanTabs?tab=readme-ov-file#url-pattern"
                        target="_blank"
                      >
                        参考文档
                      </a>
                    </li>
                    <li>闲置时长：离开标签页后的时间（支持 m/h/d 单位）</li>
                    <li>动作：从内存中休眠标签页（标签仍可见）</li>
                    <li>→暂存：仅在动作为关闭时生效</li>
                  </ul>
                </div>
              ) : (
                <div className="text-sm leading-7">
                  <h1 className="font-bold text-base mb-2">规则</h1>
                  <ul className="list-disc list-inside">
                    <li>
                      URL 匹配模式：
                      <a
                        className="text-primary underline"
                        href="https://github.com/heyppen/CleanTabs?tab=readme-ov-file#url-pattern"
                        target="_blank"
                      >
                        参考文档
                      </a>
                    </li>
                    <li>闲置时长：离开标签页后的时间（如 30m、5h、2d）</li>
                    <li>动作：从内存中休眠标签页（标签仍可见）</li>
                    <li>→暂存、禁用可以省略</li>
                  </ul>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <TabsContent value="table" className="m-0 h-[302px]">
          <RulesTable />
        </TabsContent>
        <TabsContent value="editor" className="m-0 h-[302px]">
          <RulesEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
