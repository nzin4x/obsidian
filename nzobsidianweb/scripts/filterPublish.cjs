const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const fg = require("fast-glob");

// 링크 처리를 위한 유틸리티 함수들
function processWikiLinks(content, filePath, allFiles) {
  // [[링크]] 또는 [[링크|타이틀]] 형식의 위키링크를 처리
  return content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    const [link, title] = p1.split("|").map(s => s.trim());
    const displayText = title || link;
    
    // 링크 대상 파일 찾기
    const targetFile = findTargetFile(link, filePath, allFiles);
    if (targetFile) {
      // 웹 URL로 변환
      const webPath = targetFile.replace(/\\/g, "/");
      return `[${displayText}](/notes/${webPath})`;
    }
    
    // 링크 대상을 찾지 못한 경우 텍스트만 남김
    console.log(`  ├ ⚠️ 링크 대상 없음: ${link} (in ${filePath})`);
    return displayText;
  });
}

function processMarkdownLinks(content, filePath, allFiles) {
  // [타이틀](링크) 형식의 마크다운 링크를 처리
  return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, link) => {
    // 외부 URL이면 그대로 유지
    if (link.startsWith("http://") || link.startsWith("https://")) {
      return match;
    }
    
    // 이미지 링크면 /assets/ 경로로 변환
    if (link.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      const assetPath = path.join(path.dirname(filePath), link);
      const webPath = path.relative(vaultRoot, assetPath).replace(/\\/g, "/");
      return `[${title}](/assets/${webPath})`;
    }
    
    // 내부 문서 링크면 /notes/ 경로로 변환
    const targetFile = findTargetFile(link, filePath, allFiles);
    if (targetFile) {
      const webPath = targetFile.replace(/\\/g, "/");
      return `[${title}](/notes/${webPath})`;
    }
    
    // 링크 대상을 찾지 못한 경우 텍스트만 남김
    console.log(`  ├ ⚠️ 링크 대상 없음: ${link} (in ${filePath})`);
    return title;
  });
}

function findTargetFile(link, currentFile, allFiles) {
  // 링크에서 확장자 제거 및 경로 정규화
  const linkWithoutExt = link.replace(/\.md$/, "");
  const currentDir = path.dirname(currentFile);
  
  // 1. 상대 경로로 찾기
  const relativePath = path.resolve(currentDir, linkWithoutExt + ".md");
  const relativeMatch = allFiles.find(f => 
    f.toLowerCase() === relativePath.toLowerCase());
  if (relativeMatch) {
    return path.relative(vaultRoot, relativeMatch);
  }
  
  // 2. 절대 경로로 찾기 (vault root 기준)
  const absolutePath = path.resolve(vaultRoot, linkWithoutExt + ".md");
  const absoluteMatch = allFiles.find(f => 
    f.toLowerCase() === absolutePath.toLowerCase());
  if (absoluteMatch) {
    return path.relative(vaultRoot, absoluteMatch);
  }
  
  // 3. 파일명만으로 찾기
  const basename = path.basename(linkWithoutExt);
  const nameMatch = allFiles.find(f => 
    path.basename(f, ".md").toLowerCase() === basename.toLowerCase());
  if (nameMatch) {
    return path.relative(vaultRoot, nameMatch);
  }
  
  return null;
}

// 부모 디렉토리 (프로젝트 루트) 및 그 상위 폴더(실제 Vaults 루트)
const projectDir = path.resolve(__dirname, "..");
const projectName = path.basename(projectDir);
// vaultRoot 은 프로젝트의 상위 폴더입니다 — 여기서 모든 서브디렉토리를 스캔합니다
const vaultRoot = path.resolve(projectDir, "..");

// 출력 경로들
const outputPath = path.resolve(__dirname, "../src/publishedList.json");
const publicAssetsDir = path.resolve(__dirname, "../public/assets");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function deleteIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✔ 이전 파일 삭제: ${filePath}`);
  }
}

// 이미지와 drawing 파일 복사
function copyAsset(sourcePath, targetPath) {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.warn(`  ├ ⚠️ 원본 파일 없음: ${sourcePath}`);
      return false;
    }

    const targetDir = path.dirname(targetPath);
    ensureDir(targetDir);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  ├ ✅ 파일 복사됨: ${path.relative(vaultRoot, sourcePath)} -> ${path.relative(projectDir, targetPath)}`);

    // drawing 파일인 경우 .writing 파일도 확인하여 복사
    if (sourcePath.endsWith('.drawing')) {
      const writingPath = sourcePath.replace('.drawing', '.writing');
      const writingTargetPath = targetPath.replace('.drawing', '.writing');
      if (fs.existsSync(writingPath)) {
        fs.copyFileSync(writingPath, writingTargetPath);
        console.log(`  ├ ✅ writing 파일 복사됨: ${path.relative(vaultRoot, writingPath)} -> ${path.relative(projectDir, writingTargetPath)}`);
      }
    }

    return true;
  } catch (e) {
    console.warn(`  ├ ⚠️ 파일 복사 실패: ${sourcePath}`, e);
    return false;
  }
}

async function main() {
  // 기존 JSON 파일 클린업
  deleteIfExists(outputPath);

  // assets 폴더 클린업 및 생성
  if (fs.existsSync(publicAssetsDir)) {
    fs.rmSync(publicAssetsDir, { recursive: true, force: true });
  }
  ensureDir(publicAssetsDir);

  console.log('🔍 문서와 이미지 스캔 시작...');
  
  // Markdown과 drawing 파일 탐색하여 publish된 파일 목록 확보
  const mdEntries = await fg(["**/*.md", "**/Ink/**/*.drawing"], {
    cwd: vaultRoot,
    dot: true,
    absolute: true,
    ignore: ["node_modules/**", "src/**", `${projectName}/**`],
  });

  // publish 태그가 있는 문서 목록과 그 문서에서 사용하는 이미지 목록 수집
  const publishedDocs = new Set();
  const requiredImages = new Set();

  for (const file of mdEntries) {
    const content = fs.readFileSync(file, "utf-8");
    const { data, content: mdContent } = matter(content);
    const rawTags = (data && data.tags) || [];
    const tagsArray = Array.isArray(rawTags) ? rawTags : rawTags.split(/[,\s]+/);
    const normalizedTags = tagsArray.map(t => String(t).toLowerCase().trim()).filter(Boolean);

      if (normalizedTags.includes("publish") || file.endsWith('.drawing')) {
        publishedDocs.add(file);
        
        if (file.endsWith('.drawing')) {
          // drawing 파일 자체도 복사
          requiredImages.add(file);
          // .writing 파일도 있다면 함께 복사
          const writingPath = file.replace('.drawing', '.writing');
          if (fs.existsSync(writingPath)) {
            requiredImages.add(writingPath);
          }
        } else {
          // 이미지 링크 추출 (![[이미지]] 형식과 ![alt](이미지) 형식 모두)
          const imageMatches = mdContent.matchAll(/(?:!\[\[([^\]]+)\]\])|(?:!\[[^\]]*\]\(([^)]+)\))/g);
          for (const match of imageMatches) {
            const imagePath = match[1] || match[2];
            if (!imagePath.startsWith('http')) {
              const fullPath = path.resolve(path.dirname(file), imagePath);
              requiredImages.add(fullPath);
            }
          }
        }      // handdrawn-ink 코드 블록 처리
      const inkMatches = mdContent.matchAll(/```handdrawn-ink\s*({[\s\S]*?})\s*```/g);
      for (const match of inkMatches) {
        try {
          const config = JSON.parse(match[1]);
          if (config.filepath) {
            // .drawing 파일 복사
            const drawingPath = path.resolve(vaultRoot, config.filepath);
            const fullPath = drawingPath.replace(/\\/g, '/');
            requiredImages.add(fullPath);
            
            // .writing 파일도 있다면 함께 복사
            const writingPath = drawingPath.replace('.drawing', '.writing');
            if (fs.existsSync(writingPath)) {
              requiredImages.add(writingPath.replace(/\\/g, '/'));
            }
          }
        } catch (e) {
          console.warn(`  ├ ⚠️ handdrawn-ink 설정 파싱 실패:`, e);
        }
      }
    }
  }

  // 이미지와 drawing 파일 목록 탐색
  const assetEntries = await fg(["**/*.{png,jpg,jpeg,gif,webp,svg,drawing,writing}"], {
    cwd: vaultRoot,
    dot: true,
    absolute: true,
    ignore: ["node_modules/**", "src/**", `${projectName}/**`],
  });

  const entries = [...publishedDocs, ...assetEntries.filter(asset => requiredImages.has(asset))];

  const publishedFiles = [];

  console.log(`\n📄 문서 스캔 시작...\n`);
  
  for (const file of entries) {
    try {
      const relativePath = path.relative(vaultRoot, file);
      console.log(`\n검사중: ${relativePath}`);
      
      // drawing 파일이면 assets로 복사
      if (file.endsWith('.drawing') || file.endsWith('.writing')) {
        const relativeToVault = path.relative(vaultRoot, file);
        const targetPath = path.join(publicAssetsDir, relativeToVault);
        copyAsset(file, targetPath);
        continue;
      }
      // Markdown 파일에서 이미지 참조 수집
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(file, "utf-8");
        const { data, content: mdContent } = matter(content);
        const rawTags = (data && data.tags) || [];
        const tagsArray = Array.isArray(rawTags) ? rawTags : rawTags.split(/[,\s]+/);
        const normalizedTags = tagsArray.map(t => String(t).toLowerCase().trim()).filter(Boolean);

        if (!normalizedTags.includes("publish")) {
          continue;
        }

        // 이미지 링크 추출
        const obsidianImageMatches = mdContent.matchAll(/!\[\[(.*?)\]\]/g);
        const markdownImageMatches = mdContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);

        // Obsidian 스타일 이미지 처리
        for (const match of obsidianImageMatches) {
          const imagePath = match[1];
          if (!imagePath.startsWith('http')) {
            const sourceFile = path.resolve(path.dirname(file), imagePath);
            const relativeToVault = path.relative(vaultRoot, sourceFile);
            const targetPath = path.join(publicAssetsDir, relativeToVault);
            copyAsset(sourceFile, targetPath);
          }
        }

        // Markdown 스타일 이미지 처리
        for (const match of markdownImageMatches) {
          const imagePath = match[2];
          if (!imagePath.startsWith('http')) {
            const sourceFile = path.resolve(path.dirname(file), imagePath);
            const relativeToVault = path.relative(vaultRoot, sourceFile);
            const targetPath = path.join(publicAssetsDir, relativeToVault);
            copyAsset(sourceFile, targetPath);
          }
        }
      }

      const content = fs.readFileSync(file, "utf-8");
      const { data, content: mdContent } = matter(content);

      // Include only if frontmatter tags contain 'publish' (accept string or array)
      const rawTags = (data && data.tags) || [];
      console.log(`  ├ 발견된 태그:`, rawTags || '태그 없음');
      let tagsArray = [];
      if (Array.isArray(rawTags)) {
        tagsArray = rawTags.map(String);
      } else if (typeof rawTags === "string") {
        // split on commas or whitespace
        tagsArray = rawTags.split(/[,\s]+/);
      }

      const normalizedTags = tagsArray.map((t) => String(t).toLowerCase().trim()).filter(Boolean);
      console.log(`  ├ 정규화된 태그:`, normalizedTags.length ? normalizedTags : '없음');
      
      if (normalizedTags.includes("publish")) {
        console.log(`  └ ✅ publish 태그 발견 - 포함됨`);
        // 필요한 frontmatter 만 추출해 출력
        const filteredFrontmatter = {
          title: data.title || "",
          date: data.date || "",
          tags: data.tags || [],
        };

        publishedFiles.push({
          // make path relative to vaultRoot so the leading folder shows which vault it came from
          path: path.relative(vaultRoot, file).replace(/\\/g, "/"), // 플랫폼 경로 통일
          frontmatter: filteredFrontmatter,
          content: mdContent,
        });
      }
    } catch (e) {
      console.warn(`⚠ 파일 처리 실패: ${file}`, e);
    }
  }

  // JSON으로 저장 (2-space indent)
  fs.writeFileSync(outputPath, JSON.stringify(publishedFiles, null, 2));
  console.log(`✔ ${publishedFiles.length}개의 publish 된 문서가 ${outputPath}에 저장되었습니다.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

