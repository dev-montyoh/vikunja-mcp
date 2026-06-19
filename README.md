<br/>

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="72" />

# vikunja-mcp

[![Push](https://github.com/dev-montyoh/vikunja-mcp/actions/workflows/push-main.yml/badge.svg)](https://github.com/dev-montyoh/vikunja-mcp/actions/workflows/push-main.yml)
[![Build](https://github.com/dev-montyoh/vikunja-mcp/actions/workflows/pull-request-main.yml/badge.svg)](https://github.com/dev-montyoh/vikunja-mcp/actions/workflows/pull-request-main.yml)

**Vikunja REST API를 Claude에서 직접 사용할 수 있도록 래핑한 커스텀 MCP 서버**

---

기존 오픈소스 vikunja-mcp의 한계(description 덮어쓰기 버그, position 미지원, 커스터마이징 불가)를 해결하기 위해 TypeScript + MCP SDK로 직접 구현했습니다.

모든 업데이트는 기존 값을 GET으로 먼저 조회한 뒤 변경 필드만 덮어쓰는 방식으로 처리하여, description 등 미포함 필드가 빈 값으로 초기화되는 버그를 원천 차단합니다.

---

## 사용 기술

- TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`)
- supergateway (stdio → HTTP/SSE 변환)
- Node.js 22
- Docker
- GitHub Actions

---

## 주요 특징

- **description 보존** — 업데이트 시 GET 후 POST 방식으로 모든 필드 보존
- **position 지원** — 전용 엔드포인트(`POST /tasks/{id}/position`)로 태스크 순서 변경
- **전체 API 커버** — Vikunja REST API의 주요 엔드포인트를 모두 지원
- **도메인별 모듈 분리** — 툴을 기능별 파일로 분리해 유지보수 용이
- **supergateway 번들** — stdio → HTTP/SSE 변환을 이미지 내에 포함, 단일 컨테이너로 운영
- **CI/CD 자동화** — PR → 빌드 검증, main push → ghcr.io 이미지 배포

---

## 지원 툴

| 도메인 | 툴 |
|---|---|
| 프로젝트 | `projects_list` · `projects_get` · `projects_create` · `projects_update` · `projects_delete` · `projects_duplicate` |
| 태스크 | `tasks_list` · `tasks_get` · `tasks_create` · `tasks_update` · `tasks_delete` · `tasks_set_position` · `tasks_duplicate` |
| 댓글 | `comments_list` · `comments_add` · `comments_update` · `comments_delete` |
| 라벨 | `labels_list` · `labels_create` · `labels_update` · `labels_delete` · `task_labels_list` · `task_labels_add` · `task_labels_remove` |
| 담당자 | `task_assignees_list` · `task_assignees_add` · `task_assignees_remove` |
| 관계 | `task_relations_add` · `task_relations_remove` |
| 유저 | `users_me` · `users_search` |

---

## 컨테이너 이미지

```
ghcr.io/dev-montyoh/vikunja-mcp:latest
```

---

## CI/CD

- **PR → main**: npm 빌드 검증
- **push → main**: ARM64 Docker 이미지 빌드 및 ghcr.io push

---

## 문서

- **[개발 가이드 →](CONTRIBUTING.md)** — 로컬 실행 · 환경변수 · 브랜치 전략
