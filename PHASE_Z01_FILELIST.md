> Do not edit `master\_build.md` in Z00.



\## Commands (run in this order)

1\) Confirm you are at repo root (must contain `.git`, `apps/`, `scripts/`)

&nbsp;  - `pwd` (should end with `...\\Compliance\\Compliance`)

2\) Create required paths (PowerShell)

&nbsp;  ```powershell

&nbsp;  mkdir -Force apps\\campaign\_compliance\\docs\\screens | Out-Null



&nbsp;  @'

&nbsp;  /// <reference types="next" />

&nbsp;  /// <reference types="next/image-types/global" />



&nbsp;  // NOTE: This file should not be edited.

&nbsp;  // See https://nextjs.org/docs/basic-features/typescript for more information.

&nbsp;  '@ | Set-Content -Encoding UTF8 apps\\campaign\_compliance\\next-env.d.ts



&nbsp;  mkdir -Force apps\\public\_site | Out-Null

&nbsp;  "Placeholder. public\_site is referenced by master\_build.md as baseline alignment." | Set-Content -Encoding UTF8 apps\\public\_site\\README.md



