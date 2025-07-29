import { Spinner } from "@govie-ds/react"

export function TableDataPlaceholder(props: { tableBodyHeight: number }) {
  return (
    <td
      colSpan={3}
      style={{
        position: "relative",
        width: "100%",
        height: `${props.tableBodyHeight}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Spinner size='xl' />
      </div>
    </td>
  )
}
