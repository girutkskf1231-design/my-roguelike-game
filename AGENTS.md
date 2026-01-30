# AGENTS.md

이 파일은 AI 에이전트가 djwida 프로젝트에서 작업할 때 따라야 할 지침을 제공합니다.

## 디자인 규칙: shadcn 활용

**디자인 및 UI 구현 시 반드시 shadcn/ui를 활용합니다.**

- 새로운 UI 요소가 필요할 때는 먼저 shadcn/ui 컴포넌트를 사용하세요.
- 직접 컴포넌트를 새로 만들기 전에 shadcn에 해당 컴포넌트가 있는지 확인하세요.
- shadcn 컴포넌트는 `src/components/ui/`에 소스로 설치되므로 필요 시 자유롭게 수정할 수 있습니다.

## shadcn/ui 컴포넌트 추가

필요한 컴포넌트는 다음 명령으로 추가하세요:

```bash
npx shadcn@latest add [component-name]
```

**예시:**
```bash
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add card button label
```

## 사용 가능한 shadcn 컴포넌트 (참고)

- **레이아웃**: card, separator, scroll-area
- **폼**: input, textarea, select, checkbox, switch, label
- **버튼**: button
- **피드백**: alert, alert-dialog, dialog, toast
- **내비게이션**: tabs, dropdown-menu
- **데이터 표시**: table, badge, avatar, skeleton
- **오버레이**: dialog, sheet, popover, dropdown-menu

## 프로젝트 구조 (관련 부분)

```
djwida/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui 컴포넌트
│   └── lib/
│       └── utils.ts      # cn() 등 유틸
└── components.json       # shadcn 설정
```

## 요약

- **디자인 = shadcn 우선**: UI는 shadcn 컴포넌트로 구현하고, 없을 때만 커스텀 컴포넌트를 고려합니다.
- **추가는 CLI로**: `npx shadcn@latest add [이름]`으로만 추가합니다.
- **일관성**: 프로젝트 전반에 shadcn 기반 디자인 시스템을 유지합니다.
