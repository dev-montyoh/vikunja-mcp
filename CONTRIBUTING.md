# 개발 가이드

[← README로 돌아가기](README.md)

## 사전 요구사항

- Node.js 22
- Docker

## 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `VIKUNJA_URL` | ✅ | Vikunja API 주소. MCP 서버가 내부적으로 API를 호출할 때 사용. (e.g. `http://vikunja:3456/api/v1`) |
| `VIKUNJA_TOKEN` | ✅ | Vikunja API 토큰. |
| `PORT` | ❌ | supergateway가 열 HTTP 포트. 기본값 `80`. |

---

## 로컬 실행

### 방법 1 — npm (stdio 모드, Claude Code 직접 연결)

supergateway 없이 MCP 서버를 stdio로 직접 실행합니다.
Claude Code `.claude/settings.json`에 등록해서 사용하는 방식이에요.

1. 리포지토리 클론

2. 의존성 설치
   ```bash
   npm ci
   ```

3. 빌드
   ```bash
   npm run build
   ```

4. Claude Code MCP 설정 (`.claude/settings.json`)
   ```json
   {
     "mcpServers": {
       "vikunja": {
         "command": "node",
         "args": ["/path/to/vikunja-mcp/dist/index.js"],
         "env": {
           "VIKUNJA_URL": "https://your-vikunja-instance/api/v1",
           "VIKUNJA_TOKEN": "your_api_token"
         }
       }
     }
   }
   ```
   > stdio 직접 연결 시 supergateway를 거치지 않습니다.

---

### 방법 2 — Docker (supergateway 포함, streamableHttp 모드)

이미지를 빌드해서 supergateway를 통해 HTTP로 노출하는 방식입니다. `/mcp` 엔드포인트가 열립니다.

1. 이미지 빌드
   ```bash
   docker build -t vikunja-mcp .
   ```

2. 컨테이너 실행
   ```bash
   docker run -p 80:80 \
     -e VIKUNJA_URL=https://your-vikunja-instance/api/v1 \
     -e VIKUNJA_TOKEN=your_api_token \
     vikunja-mcp
   ```

3. Claude Code MCP 설정
   ```bash
   claude mcp add vikunja https://your-host/mcp -t http
   ```

---

## 브랜치 전략

```
origin
  ├── main
  └── feature/
        └── branch-name
```

1. `main` 기준으로 `feature/branch-name` 브랜치 생성
2. 개발 완료 후 `main`으로 Pull Request 생성
3. GitHub Actions — ARM64 Docker 이미지 빌드 성공 확인 후 Merge

---

## 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
chore: 빌드, 설정 변경
docs: 문서 수정
```
