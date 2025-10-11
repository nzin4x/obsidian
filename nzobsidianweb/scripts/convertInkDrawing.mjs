import { TldrawApp, getSvgFromShape } from '@tldraw/tldraw';
import fs from 'fs/promises';
import path from 'path';

export async function convertDrawingToSvg(drawingPath, outputPath) {
  try {
    // .drawing 파일 읽기
    const drawingContent = await fs.readFile(drawingPath, 'utf-8');
    const drawingData = JSON.parse(drawingContent);

    // tldraw 앱 인스턴스 생성
    const app = new TldrawApp();
    
    // 드로잉 데이터 로드
    app.loadDocument(drawingData);

    // 모든 shape를 SVG로 변환
    const shapes = Object.values(app.getSnapshot().document.pages.page.shapes);
    const svgElements = await Promise.all(
      shapes.map(shape => getSvgFromShape(shape, app))
    );

    // SVG 요소들을 하나의 SVG 문서로 결합
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        ${svgElements.join('\n')}
      </svg>
    `;

    // SVG 파일 저장
    await fs.writeFile(outputPath, svg);
    return true;
  } catch (error) {
    console.error('Failed to convert drawing to SVG:', error);
    return false;
  }
}