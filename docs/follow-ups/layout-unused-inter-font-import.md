# layout.tsx가 사용하지 않는 Inter 폰트를 import한다

**Symptom**: `bun run lint`가 `app/layout.tsx`에서 `'Inter' is defined but never used` 경고를 낸다.

**Observed evidence**: `bun run lint` 실행 결과, `app/layout.tsx:2:29`. 이 import는 낙하 낱말 타자 게임 작업 이전부터 있던 코드이며 이번 변경에서 건드리지 않았다.

**Suspected cause**: 템플릿 초기 상태에서 `Inter` 폰트를 불러왔지만 실제로는 `Oxanium`(`--font-sans`)과 `Noto_Sans`(`--font-heading`)만 쓰고 있어, `Inter` 선언이 남아있는 것으로 보인다.

**What was tried**: 이번 작업 범위 밖이라 손대지 않았다.

**Proposed next step**: `app/layout.tsx`에서 `Inter` import와 관련 호출을 실제로 쓰지 않는다면 제거하고, 만약 의도된 폰트라면 실제로 `--font-*` 변수에 연결한다.
