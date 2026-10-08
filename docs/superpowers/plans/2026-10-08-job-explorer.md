# Job Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 제출용 일자리 탐색 시안에서 지원과 카드 뒷면 거절 피드백을 체험한다.
**Architecture:** 의존성 없는 정적 웹. 상태와 공고 데이터를 UI에서 분리하고 pointer events와 CSS 3D transform으로 제스처를 구현한다.
**Tech Stack:** HTML, CSS, JavaScript, Node test runner, Playwright 검증.
**Spec:** `docs/superpowers/specs/2026-10-08-job-explorer-design.md`

## Global Constraints
- 지원 안내문구: “플러팅을 날렸습니다”.
- 거절 사유는 필수이며 카드 뒷면에서 클릭하여 선택한다.
- 헤더 중앙 일자리 탐색, 우측 남은 공고 수.
- 실제 지원 전송 없음. 가상 데이터만 사용.

## Review Focus
- 빠른 반복 입력은 한 공고를 중복 처리하지 않는다.
- 드래그 취소/짧은 이동은 지원 또는 거절을 만들지 않는다.
- 기타만 선택한 상태에서 공백 입력은 거절 완료할 수 없다.
- 뒤집힌 카드 앞면은 키보드/터치로 조작되지 않는다.
- 마지막 공고 처리 후 개수는 0이며 재시작 가능하다.

## Task 1: 공고 처리 상태
Files: `prototype/state.js`, `prototype/tests/state.test.cjs`.
Interface: `createSession(total)`, `openFeedback()`, `cancelFeedback()`, `apply()`, `reject(reasons, detail)`, `restart()`; readonly snapshots via `snapshot()`.
- [x] 단위 테스트 작성, 구현 전 실패 확인.
- [x] 필수 사유/취소/완료 상태 구현, 전체 단위 테스트 통과.

## Task 2: 카드 화면과 조작
Files: `prototype/index.html`, `prototype/styles.css`, `prototype/jobs.js`, `prototype/app.js`, `prototype/assets/office.jpg`.
- [x] 브라우저 검증 스크립트 작성, 미구현 동작 실패 확인.
- [x] 원본 PDF 사진 추출 및 화면, 클릭/키보드 조작, 뒤집기, 드래그 구현.
- [x] 브라우저 검증으로 지원/거절/취소/완료/반복 입력/레이아웃 확인.

## Task 3: 전달
Files: `prototype/README.md`, `prototype/tests/browser.cjs`, `output/prototype-preview.png`.
- [x] 좁은 화면, 터치, 모션 감소 및 전체 테스트 실행.
- [x] 최종 화면 캡처를 확인하고 실행 방법과 한계를 기록한다.

## Progress
- Ruling: 사용자 “그 구성으로 진행해”를 구현 진행 승인으로 적용한다. 추가 승인 반복 없이 명시한 카드 뒤집기 조건을 반영한다.
- Ruling: Git 저장소가 아닌 자료 폴더이므로 `prototype/`에 신규 파일을 격리하며 기존 디자인 자료는 수정하지 않는다.
- Task 1: complete — Node 단위 테스트 6개 통과. 구현 전 실제 상태 전이 테스트 실패를 확인함.
- Task 2: complete — 브라우저에서 지원, 거절, 기타 공백 검증, 취소, 카운트, 중복 입력, 상세보기, 완료/재시작 검증 통과.
- Task 3: complete — 320/390/430/1280px에서 가로 넘침 없음. 키보드, 모션 감소, 모바일 터치 스와이프/사유 선택/제출/터치 취소 검증 통과. 페이지 JS 오류 0건.
- Independent review: dialog accessible name 누락 1건 발견. 수정 전 회귀 테스트 실패를 확인하고 aria-labelledby="dialog-title" 적용 후 통과.
- Test harness finding: Edge CDP에서 지연 없는 touchStart/move/end 및 touchCancel 조합은 기본 HTML 버튼에서도 후속 click을 누락함. 앱과 무관한 네이티브 HTML 비교로 확인. 실제 손가락 이동과 유사하게 여러 move 이벤트를 20ms 간격으로 주입하고 취소 케이스를 마지막에 분리하여 검증함.
- Visual QA: output/prototype-preview.png 및 output/prototype-feedback.png를 직접 확인. 원본 PDF 사진과 세로 손잡이 유지, 카드 뒷면 선택 표시와 완료 버튼 확인.
- Limit: Windows Edge 모바일 에뮬레이션 검증이며 실제 iOS Safari 기기 검증은 수행하지 않음. 실제 기업 지원/매칭 API 및 서버 저장은 시안 범위에 포함하지 않음.
