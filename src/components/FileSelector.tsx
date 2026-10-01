import { useRef, useState, type DragEvent } from 'react'

type Props = {
  onFile: (fileName: string, fileText: string) => void
  onError: (message: string) => void
}

export function FileSelector({ onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function loadFile(file: File | undefined): void {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError(`"${file.name}" no es un archivo CSV.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => onFile(file.name, String(reader.result ?? ''))
    reader.onerror = () => onError('No se pudo leer el archivo.')
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDraggingOver(false)
    loadFile(event.dataTransfer.files?.[0])
  }

  return (
    <div
      className={`dropzone ${isDraggingOver ? 'is-active' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <p className="dropzone-title">Arrastra aquí tu exportación de Jira en CSV</p>
      <p className="dropzone-sub">o</p>
      <button
        type="button"
        className="btn-primary"
        onClick={() => inputRef.current?.click()}
      >
        Seleccionar archivo CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(event) => {
          loadFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}