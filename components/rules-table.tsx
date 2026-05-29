import { useState, useEffect, useMemo, useCallback, useContext } from "react"

import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnFiltersState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table as TableDiv,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DebouncedInput, Input } from "@/components/ui/input"
import {
  Action,
  Actions,
  Rule,
  DefaultRules,
  v_rule_pattern,
  ValidateRule,
  ValidateRules,
  ValidationResult,
  TimeUnit,
  toMinutes,
  fromMinutes,
  getBestUnit,
} from "@/lib/rule"
import { Checkbox, SmallCheckbox } from "@/components/ui/checkbox"
import { Plus, Ellipsis } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { storage } from "wxt/storage"
import { STORAGE_KEY_RULES } from "@/lib/storage"
import { AppStateContext } from "./Providers"
import { browser } from "wxt/browser"

interface TabListItem {
  favicon_url: string
  title: string
  url: string
}

function makeDraftRule(url: string): Rule {
  let pattern = ""
  const url_ = URL.parse(url)
  if (url_) {
    pattern = `${url_.origin}/*`
  }

  return {
    url_pattern: pattern,
    inactive_minutes: 3,
    action: "discard",
    to_stash: true,
    disabled: false,
    dirty: true,
  }
}

// TODO:
// - fields validation ✅
// - duplicate ✅
// - batch operations ✅
// - inactive, action edit ✅
// - new column: add_to_stash ✅
// - adjust ordering ✅
export default function RulesTable() {
  const { rules: data, setRules: _setData } = useContext(AppStateContext)
  const [dataDirty, setDataDirty] = useState(false)
  const [vResult, setVResult] = useState<ValidationResult>({ ok: true })

  function newRule(url: string) {
    _setData([makeDraftRule(url), ...data])
    setDataDirty(true)
    setRowSelection({})
  }

  function updateData(rowIndex: number, updates: Partial<Rule>) {
    const newData = data.map((val, index) => {
      if (index === rowIndex) {
        return { ...data[rowIndex], ...updates, dirty: true }
      } else {
        return val
      }
    })
    _setData(newData)
    setDataDirty(true)
  }

  function deleteRules(...indices: number[]) {
    if (indices.length < 1) return
    _setData(data.filter((_, i) => !indices.includes(i)))
    setDataDirty(true)
    setRowSelection({})
  }

  function duplicateRule(index: number) {
    const rule: Rule = { ...data[index], dirty: true }
    _setData([...data.slice(0, index + 1), rule, ...data.slice(index + 1)])
    setDataDirty(true)
    setRowSelection({})
  }

  function moveUp(index: number) {
    if (index < 1) return
    const copy: Rule[] = [...data]
    ;[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]
    _setData(copy)
    setDataDirty(true)
    setRowSelection({})
  }

  function moveDown(index: number) {
    if (index >= data.length - 1) return
    const copy: Rule[] = [...data]
    ;[copy[index + 1], copy[index]] = [copy[index], copy[index + 1]]
    _setData(copy)
    setDataDirty(true)
    setRowSelection({})
  }

  function saveData() {
    if (!vResult.ok) {
      return
    }

    const newData = data.map((val) => {
      return { ...val, dirty: undefined }
    })
    storage.setItem(STORAGE_KEY_RULES, newData)
    _setData(newData)
    setDataDirty(false)
  }

  useEffect(() => {
    const res = ValidateRules(data)
    setVResult(res)
  }, [data, dataDirty])

  const columns = useMemo(() => {
    const columns: ColumnDef<Rule>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <SmallCheckbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="全选"
            className="rounded-[5px]"
          />
        ),
        cell: ({ row }) => (
          <SmallCheckbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择此行"
            className="rounded-[5px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "index",
        header: "序号",
        cell: ({ row }) => {
          return row.index + 1
        },
      },
      {
        accessorKey: "url_pattern",
        header: "URL 匹配模式",
        cell: ({ getValue, row }) => {
          const initialValue: string = getValue() as string
          const [value, setValue] = useState(initialValue)
          const [valid, setValid] = useState(true)

          useEffect(() => {
            setValue(initialValue)
          }, [initialValue])

          useEffect(() => {
            if (value === "") {
              setValid(false)
              return
            }

            const res = v_rule_pattern(value)
            if (!res.ok) {
              setValid(false)
              return
            }

            setValid(true)
          }, [value])

          return (
            <div className="w-60 font-mono text-xs">
              <Input
                value={value}
                className={cn(
                  "cell-input py-0 px-2 focus-visible:ring-0 focus-visible:ring-offset-0",
                  valid ? "" : "border-red-500 focus-visible:border-red-500"
                )}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                  if (value !== initialValue) {
                    updateData(row.index, { url_pattern: value })
                  }
                }}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "inactive_minutes",
        header: "闲置时长",
        cell: ({ getValue, row }) => {
          const initialMinutes = getValue() as number
          const initialUnit = getBestUnit(initialMinutes)
          const [unit, setUnit] = useState<TimeUnit>(initialUnit)
          const [value, setValue] = useState(
            fromMinutes(initialMinutes, initialUnit).toString()
          )
          const [valid, setValid] = useState(true)

          useEffect(() => {
            const newUnit = getBestUnit(initialMinutes)
            setUnit(newUnit)
            setValue(fromMinutes(initialMinutes, newUnit).toString())
          }, [initialMinutes])

          useEffect(() => {
            if (value === "") {
              setValid(false)
              return
            }

            if (!/^\d+(\.\d+)?$/.test(value)) {
              setValid(false)
              return
            }
            const n = parseFloat(value)
            if (isNaN(n)) {
              setValid(false)
              return
            }

            const minutes = toMinutes(n, unit)
            if (minutes < 0 || minutes > 30 * 24 * 60) {
              setValid(false)
              return
            }

            setValid(true)
          }, [value, unit])

          const handleBlur = () => {
            if (valid) {
              const n = parseFloat(value)
              const minutes = toMinutes(n, unit)
              if (minutes !== initialMinutes) {
                updateData(row.index, { inactive_minutes: minutes })
              }
            } else {
              // Reset to initial value
              const newUnit = getBestUnit(initialMinutes)
              setUnit(newUnit)
              setValue(fromMinutes(initialMinutes, newUnit).toString())
            }
          }

          const handleUnitChange = (newUnit: TimeUnit) => {
            const currentMinutes = toMinutes(parseFloat(value), unit)
            setUnit(newUnit)
            const newValue = fromMinutes(currentMinutes, newUnit)
            // Only show decimals if necessary
            setValue(
              newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(2)
            )
          }

          return (
            <div className="flex gap-1 items-center font-mono text-xs">
              <Input
                value={value}
                className={cn(
                  "cell-input w-14 py-0 px-2 focus-visible:ring-0 focus-visible:ring-offset-0",
                  valid ? "" : "border-red-500 focus-visible:border-red-500"
                )}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
              />
              <Select value={unit} onValueChange={handleUnitChange}>
                <SelectTrigger
                  className="unit-select-trigger w-14 px-1 border-none focus:ring-0 focus:ring-offset-0"
                  noIcon={true}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[6px]">
                  <SelectItem value="minutes" className="h-7 text-xs">
                    分钟
                  </SelectItem>
                  <SelectItem value="hours" className="h-7 text-xs">
                    小时
                  </SelectItem>
                  <SelectItem value="days" className="h-7 text-xs">
                    天
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
      },
      {
        accessorKey: "action",
        header: "动作",
        cell: ({ getValue, row }) => {
          const initialValue = getValue() as Action
          const [value, setValue] = useState<Action>(initialValue)
          useEffect(() => {
            setValue(initialValue)
          }, [initialValue])

          return (
            <Select
              value={value}
              onValueChange={(val) => {
                setValue(val as Action)
                updateData(row.index, { action: val as Action })
              }}
            >
              <SelectTrigger
                className="action-select-trigger w-[74px] justify-start relative -left-2 px-2 border-none focus:ring-0 focus:ring-offset-0"
                noIcon={true}
              >
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent className="rounded-[6px]">
                {Object.values(Actions).map((action) => {
                  const className = {
                    nop: "action-badge-nop",
                    discard: "action-badge-discard",
                    close: "action-badge-close",
                  }[action.action]

                  return (
                    <SelectItem
                      key={action.action}
                      value={action.action}
                      className="h-7 pr-0 rounded-[4px]"
                    >
                      <div
                        className={cn(
                          "action-badge",
                          className
                        )}
                      >
                        <span>{action.display}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )
        },
      },
      {
        accessorKey: "to_stash",
        header: "→暂存",
        cell: ({ getValue, row: { index }, column: { id }, table }) => {
          const initialValue: boolean = getValue() ? true : false
          const [value, setValue] = useState<boolean>(initialValue)
          useEffect(() => {
            setValue(initialValue)
          }, [initialValue])

          function onChange(value: boolean) {
            setValue(value)
            updateData(index, { to_stash: value })
          }
          return (
            <Switch
              className="clean-switch"
              checked={value}
              onCheckedChange={onChange}
            />
          )
        },
      },
      {
        accessorKey: "disabled",
        header: "禁用",
        cell: ({ getValue, row: { index }, column: { id }, table }) => {
          const initialValue: boolean = getValue() as boolean
          const [value, setValue] = useState(initialValue)
          useEffect(() => {
            setValue(initialValue)
          }, [initialValue])

          function onChange(value: boolean) {
            setValue(value)
            updateData(index, { disabled: value })
          }

          return (
            <Switch
              className="clean-switch"
              checked={value}
              onCheckedChange={onChange}
            />
          )
        },
      },
      {
        id: "operations",
        header: "",
        cell: ({ row }) => {
          const rule = row.original
          return (
            <div className="flex gap-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="toolbar-icon-button"
                    title="更多操作"
                  >
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      duplicateRule(row.index)
                    }}
                  >
                    复制
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      deleteRules(row.index)
                    }}
                    className="focus:text-destructive focus:bg-red-100 dark:focus:bg-red-600 dark:text-white"
                  >
                    删除
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={row.index < 1}
                    onClick={() => {
                      moveUp(row.index)
                    }}
                  >
                    上移
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={row.index >= data.length - 1}
                    onClick={() => {
                      moveDown(row.index)
                    }}
                  >
                    下移
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]
    return columns
  }, [data])
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    filterFns: {},
    state: {
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  const batchOperationsDisabled = !(
    table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()
  )

  const regexColumn = table.getColumn("url_pattern")

  const [tabList, setTabList] = useState<TabListItem[]>([])

  async function refreshTabList() {
    console.log("refreshTabList")
    const tabs = await browser.tabs.query({})
    setTabList(
      tabs
        .filter((t) => t.url && t.favIconUrl && t.title)
        .map((t): TabListItem => {
          return {
            favicon_url: t.favIconUrl!,
            url: t.url!,
            title: t.title!,
          }
        })
    )
  }

  return (
    <div className="view-stack">
      <div className="view-toolbar">
        <div className="view-toolbar-left">
          {dataDirty && (
            <div className="dirty-banner">
              <span>{vResult.ok ? "规则已修改" : vResult.reason}</span>
              <Button
                size="sm"
                className="primary-compact-button"
                title="保存规则"
                onClick={saveData}
              >
                保存
              </Button>
            </div>
          )}
        </div>
        <div className="view-toolbar-right">
          <DebouncedInput
            placeholder="搜索规则"
            className="clean-search w-56 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={(regexColumn?.getFilterValue() as string) ?? ""}
            onChange={(value) => {
              regexColumn?.setFilterValue(value)
            }}
          />
          <div className="toolbar-actions">
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) {
                  refreshTabList()
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="toolbar-icon-button"
                  title="新建规则"
                  onClick={refreshTabList}
                >
                  <Plus />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem
                  onClick={() => {
                    newRule("")
                  }}
                >
                  新建空白规则
                </DropdownMenuItem>

                {tabList.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>从标签页创建</DropdownMenuLabel>
                    <div className="max-h-[200px] overflow-y-scroll">
                      {tabList.map((t) => {
                        const url = URL.parse(t.url)
                        return (
                          <DropdownMenuItem
                            key={t.url}
                            onClick={() => {
                              newRule(t.url)
                            }}
                          >
                            <img src={t.favicon_url} className="h-4 w-4" />
                            <span className="max-w-48 overflow-hidden text-nowrap text-ellipsis">
                              {t.title}
                            </span>
                            <span className="text-gray-500">{url?.host}</span>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="toolbar-icon-button"
                  title="批量操作"
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem
                  disabled={batchOperationsDisabled}
                  onClick={() => {
                    deleteRules(
                      ...table
                        .getSelectedRowModel()
                        .flatRows.map((r) => r.index)
                    )
                    setRowSelection({})
                  }}
                  className="focus:text-destructive focus:bg-red-100 dark:focus:bg-red-600 dark:text-white"
                >
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="clean-table-shell rules-table-shell">
        <TableDiv className="">
          <TableHeader className="sticky top-0 bg-secondary z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 pr-0",
                        ["to_stash", "disabled"].includes(header.column.id)
                          ? "text-center px-2"
                          : ""
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "clean-table-row",
                    row.original.dirty ? "rule-row-dirty" : ""
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2 pr-0",
                        ["to_stash", "disabled"].includes(cell.column.id)
                          ? "text-center px-0"
                          : ""
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="empty-state h-24 text-center"
                >
                  暂无规则
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableDiv>
      </div>
      {/* <div className="py-2 font-mono"> */}
      {/*   #Rules: {data.length} */}
      {/* </div> */}
    </div>
  )
}
