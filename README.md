# 블랙셀러 가이드 퀴즈

블랙셀러 통합 가이드 기반 작업자 교육 퀴즈 앱입니다.

## 파일 구조

```
blackseller-quiz/
├── index.html        ← 메인 앱 (프론트엔드 전체)
├── api/
│   └── generate.js   ← Vercel 서버리스 함수 (API 키 보호)
├── vercel.json       ← Vercel 배포 설정
└── README.md
```

## 배포 방법 (Vercel + GitHub)

### 1단계 — GitHub에 올리기
1. GitHub에서 새 저장소(repository) 만들기
2. 이 폴더의 파일 4개를 모두 업로드

### 2단계 — Vercel 연결
1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. "Add New Project" → GitHub 저장소 선택
3. 그대로 Deploy 클릭 (설정 변경 불필요)

### 3단계 — API 키 환경변수 등록 ⚠️ 중요
1. Vercel 대시보드 → 프로젝트 선택 → Settings → Environment Variables
2. 아래와 같이 추가:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (본인 API 키)
   - Environment: Production, Preview, Development 모두 체크
3. 저장 후 Vercel에서 Redeploy

## 주요 기능

| 역할 | 기능 |
|------|------|
| 관리자 | 비밀번호(admin1234) 입력 후 접근 |
| 관리자 | API 키 입력 → 랜덤 퀴즈 생성 |
| 관리자 | 퀴즈 미리보기 (정답 표시) |
| 관리자 | 작업자 정답률 확인 |
| 위반사유 작업자 | 오늘의 퀴즈 풀기 |
| 플랫폼 신고 작업자 | 오늘의 퀴즈 풀기 |

## 보안 구조

- API 키는 Vercel 서버 환경변수에만 저장됨
- 브라우저에는 절대 노출되지 않음
- 관리자 탭은 비밀번호로 보호됨

## 관리자 비밀번호 변경

`index.html` 파일에서 아래 줄을 수정:
```js
const ADMIN_PW = 'admin1234';  // ← 원하는 비밀번호로 변경
```
