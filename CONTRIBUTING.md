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
| `BASE_URL` | ✅ | supergateway가 SSE 클라이언트에게 노출하는 외부 공개 주소. (e.g. `https://example.com/api/mcp/vikunja`) |
| `PORT` | ❌ | supergateway가 열 HTTP 포트. 기본값 `80`. |

> `VIKUNJA_URL`은 컨테이너 내부 통신 주소, `BASE_URL`은 외부에서 접근하는 공개 주소입니다.

---

## 로컬 실행

1. 리포지토리 클론

2. 의존성 설치
   ```bash
   npm ci
   ```

3. 환경변수 설정
   ```bash
   export VIKUNJA_URL=https://your-vikunja-instance/api/v1
   export VIKUNJA_TOKEN=your_api_token
   ```

4. 개발 모드 실행 (stdio 모드, supergateway 없이)
   ```bash
   npm run dev
   ```

   또는 빌드 후 실행
   ```bash
   npm run build
   node dist/index.js
   ```

---

## Claude Code 연동

`.claude/settings.json`에 MCP 서버를 등록합니다.

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
