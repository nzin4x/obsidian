import { Tldraw } from '@tldraw/tldraw'
import type { TLEditorSnapshot } from '@tldraw/tldraw'
import { useEffect, useState } from 'react'
import '@tldraw/tldraw/tldraw.css'

interface DrawingMetadata {
  versionAtEmbed: string;
  filepath: string;
  width: number;
  aspectRatio: number;
}

interface HandDrawnInkProps {
  filepath: string
}

export function HandDrawnInk({ filepath }: HandDrawnInkProps) {
  const [snapshot, setSnapshot] = useState<TLEditorSnapshot | null>(null)

  useEffect(() => {
    // Load drawing file
    async function loadFiles() {
      try {
        // 먼저 메타데이터 파일을 읽어옴
        const metadataResponse = await fetch(`/assets/${filepath}`)
        
        if (!metadataResponse.ok) {
          throw new Error('Failed to load metadata')
        }

        const metadata = await metadataResponse.json() as DrawingMetadata
        setMetadata(metadata)
        
        // 실제 drawing 파일 경로를 구성
        const drawingPath = `/assets/${metadata.filepath}`
        const drawingResponse = await fetch(drawingPath)

        if (drawingResponse.ok) {
          const drawingData = await drawingResponse.json()
          setSnapshot(drawingData as TLEditorSnapshot)
        }
      } catch (error) {
        console.error('Error loading drawing file:', error)
      }
    }

    loadFiles()
  }, [filepath])

  const [metadata, setMetadata] = useState<DrawingMetadata | null>(null)

  if (!snapshot || !metadata) {
    return <div>Loading drawing...</div>
  }

  return (
    <div style={{ 
      width: metadata.width + 'px', 
      height: metadata.width / metadata.aspectRatio + 'px', 
      border: '1px solid #ddd',
      maxWidth: '100%'
    }}>
      <Tldraw snapshot={snapshot} />
    </div>
  )
}