# 고용24 · 일자리 탐색 시안

1차 서류 제출용으로 만든 카드 기반 일자리 탐색 웹 시안입니다.

## 실행

`prototype/index.html`을 Edge 또는 Chrome으로 열면 바로 체험할 수 있습니다. 별도의 설치나 빌드는 필요하지 않습니다.

- 아래로 당기기: 아래에서 위로 뒤집힌 뒷면에 **플러팅을 날렸습니다** 표시 후 다음 공고 이동
- 위로 밀기: 위에서 아래로 뒤집힌 뒷면에서 거절 사유 선택
- 거절 사유는 필수이며, 확정 후 다음 공고로 이동
- 상단 페이지명과 남은 공고 수, 마지막 공고 완료 화면 제공

가상 공고 6개로 동작하며 실제 지원·기업 매칭·서버 저장은 연결되어 있지 않습니다. 새로고침하면 체험 기록이 초기화됩니다.

## 구성

- `prototype/`: 실행 가능한 시안, 공고 데이터, 테스트, 상세 실행 안내
- `고용24_디자인_가이드.md`: 디자인 방향과 화면 가이드
- `docs/`: 구현 명세, 계획, 검증 기록
- `output/`: 디자인 시안, 화면 캡처, 제출용 압축 파일

임시 파일과 로컬 서버 로그는 Git에 포함하지 않습니다.

## 검증

```sh
node --test prototype/tests/state.test.cjs
node prototype/tests/browser.cjs
node prototype/tests/flip.cjs
node prototype/tests/card-layout.cjs
```

브라우저 검증은 Playwright와 Edge가 필요합니다. 다른 개발 환경에서는 `PLAYWRIGHT_PATH`를 설치된 Playwright 패키지 경로로 지정합니다. 자세한 실행 방법과 시안 범위는 [prototype/README.md](prototype/README.md)를 참고하세요.
