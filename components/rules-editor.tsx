import { EditorView, useCodeMirror, Compartment } from "@uiw/react-codemirror"
import { csv } from "codemirror-lang-ct"
import { githubLight, githubDark } from "@uiw/codemirror-theme-github"

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { AppStateContext } from "./Providers"
import { ParseRulesText, Rule2Text } from "@/lib/rule"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

const NEW_LINES = "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"

const themeConfig = new Compartment()

export default function RulesEditor() {
  const editor = useRef(null)
  const editorText = useRef<string>("")

  const { rules, setRules } = useContext(AppStateContext)
  const [message, setMessage] = useState("")
  const { theme } = useTheme()

  const rulesText = useMemo(() => {
    let text = `// URL 匹配模式, 闲置时长 (如 30m, 5h, 2d), 动作 (nop/discard/close), →暂存, 禁用\n`
    text += rules.map((r) => Rule2Text(r)).join("\n")
    if (rules.length < 15) {
      text += NEW_LINES.slice(0, 15 - rules.length)
    }
    return text
  }, [rules])

  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    minHeight: "300px",
    maxHeight: "300px",
    value: rulesText,
    extensions: [CodeMirrorExtStyle, csv()],
    theme: githubLight,
    basicSetup: {
      syntaxHighlighting: true,
      autocompletion: true,
    },
    onChange: (value: string, _: any) => {
      editorText.current = value
    },
  })

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current)
    }
  }, [editor.current])

  useEffect(() => {
    view?.dispatch({
      effects: themeConfig.reconfigure(
        theme === "dark" ? githubDark : githubLight
      ),
    })
  }, [theme])

  useEffect(() => {
    EditorView.theme({
      "&.cm-focused": {
        outline: "none",
      },
    })

    editorText.current = rulesText
  }, [])

  function Parse() {
    setMessage("")
    const text = editorText.current
    try {
      const rules = ParseRulesText(text)
      console.log("Parsed rules:", rules)
      setRules(rules, { toStorage: true })
    } catch (error) {
      console.log(error)
      setMessage(error instanceof Error ? error.message : `${error}`)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-end items-baseline gap-2">
        <span className="text-red-500">{message}</span>
        <Button size="sm" className="h-8" onClick={Parse}>
          保存
        </Button>
      </div>
      <div ref={editor} className="mt-2 h-[302px] border"></div>
    </div>
  )
}

const CodeMirrorExtStyle = EditorView.baseTheme({
  "&": {
    "font-size": "13px",
  },
  "&.cm-focused": {
    outline: "none",
  },
})
