# Changelog

## [1.2.1](https://github.com/ku-cse-grad-proj/AIew/compare/aiew-v1.2.0...aiew-v1.2.1) (2025-12-17)


### CI/CD

* release-please에 packages:write 권한 추가 ([b652291](https://github.com/ku-cse-grad-proj/AIew/commit/b652291f8cb0e919c7e24d5f330c24f577489829))
* release-please에서 CD workflow 직접 호출하도록 변경 ([0502729](https://github.com/ku-cse-grad-proj/AIew/commit/05027294f97e5c101abd4df78b9bf80f806aa92a))

## [1.2.0](https://github.com/ku-cse-grad-proj/AIew/compare/aiew-v1.1.0...aiew-v1.2.0) (2025-12-17)


### Features

* **ai:** evaluation ([#36](https://github.com/ku-cse-grad-proj/AIew/issues/36)) ([bd6223f](https://github.com/ku-cse-grad-proj/AIew/commit/bd6223fd4974ae7b7192193291887407ceda2321))
* **ai:** refactor evaluation models and add session evaluation functionality ([#69](https://github.com/ku-cse-grad-proj/AIew/issues/69)) ([7dbaa75](https://github.com/ku-cse-grad-proj/AIew/commit/7dbaa755f09423fc97286850e6fd8986237ea9d6))
* release-please 도입 ([#147](https://github.com/ku-cse-grad-proj/AIew/issues/147)) ([9f94267](https://github.com/ku-cse-grad-proj/AIew/commit/9f942679585a96fed39ca484b4bafbce09eded30))
* **repo:** setup CI, linting, formatting, git hook ([d5f60ce](https://github.com/ku-cse-grad-proj/AIew/commit/d5f60ce50d48ac78c2e3792635a1e89582f3f491))


### Bug Fixes

* **ai-server:** update Python version to 3.11 and remove exceptiongroup dependency ([f5c771f](https://github.com/ku-cse-grad-proj/AIew/commit/f5c771f611eafa1129c6d7a71997de96ade3320d))
* **ai:** Fix criteria field name in question generation prompt ([83ad9a5](https://github.com/ku-cse-grad-proj/AIew/commit/83ad9a58ac1709903731f30e1b8e360b745ed4eb))
* **ai:** update evaluation model to remove tail question ([#75](https://github.com/ku-cse-grad-proj/AIew/issues/75)) ([5f6d3b6](https://github.com/ku-cse-grad-proj/AIew/commit/5f6d3b6b50a00bf806e44f2f15b97be093fb9ffd))
* **ci:** github actions의 pnpm 버전 충돌 해결 및 husky 설정 업데이트 ([f3e79d6](https://github.com/ku-cse-grad-proj/AIew/commit/f3e79d68e580fc3786f5043bad07f7241750c958))
* **ci:** Lint, Build 오류 수정 ([ca0dbc6](https://github.com/ku-cse-grad-proj/AIew/commit/ca0dbc64373565bef4b1ae31a345a70583ea8317))
* **ci:** pnpm 버전 충돌 및 테스트 스크립트 glob 문제 해결 ([d53bd9a](https://github.com/ku-cse-grad-proj/AIew/commit/d53bd9a7b2af795f78c4eef2fe08ecaa07131a40))
* **ci:** release-please target-branch를 main으로 설정 ([438bfaa](https://github.com/ku-cse-grad-proj/AIew/commit/438bfaaa3f8722582137dfdb07a1f5b3cc3384ee))
* **scripts:** update quotes in dev script for consistency ([bc62080](https://github.com/ku-cse-grad-proj/AIew/commit/bc62080127337d81fe55c9a0d0a0294a5c699409))


### Documentation

* **contributing:** add corepack setup instructions ([4d3c47d](https://github.com/ku-cse-grad-proj/AIew/commit/4d3c47d767105fc63bc2ab52913102b71b69900c))
* update pr template for frontend ([58fe3f2](https://github.com/ku-cse-grad-proj/AIew/commit/58fe3f2adb4674f613e5dd012ae2e33e0d2d7aac))


### Chores

* **ci:** free disk space 작업 추가 ([#115](https://github.com/ku-cse-grad-proj/AIew/issues/115)) ([ed44c85](https://github.com/ku-cse-grad-proj/AIew/commit/ed44c8505f5b04c0db1306af233a4039ddaf5716))
* **deps, ci, husky:** automate poetry lock and update CI/pre-commit ([4a110fb](https://github.com/ku-cse-grad-proj/AIew/commit/4a110fbd43950156895374f0d39832335b51f34c))
* **deps:** bump axios from 1.10.0 to 1.11.0 ([#11](https://github.com/ku-cse-grad-proj/AIew/issues/11)) ([28a1ffa](https://github.com/ku-cse-grad-proj/AIew/commit/28a1ffa4ec7e4c765992e81a55c8f8a21480be43))
* **deps:** bump filelock from 3.20.0 to 3.20.1 in /apps/ai-server ([#146](https://github.com/ku-cse-grad-proj/AIew/issues/146)) ([bbf53ef](https://github.com/ku-cse-grad-proj/AIew/commit/bbf53efbbb48ac5d4ad7404bab11c8b819d64b81))
* **deps:** bump fonttools from 4.60.1 to 4.61.0 in /apps/ai-server ([#136](https://github.com/ku-cse-grad-proj/AIew/issues/136)) ([600d869](https://github.com/ku-cse-grad-proj/AIew/commit/600d869528a3f9bab722a31a7c73f5c50674d887))
* **deps:** bump keras from 3.11.3 to 3.12.0 in /apps/ai-server ([#101](https://github.com/ku-cse-grad-proj/AIew/issues/101)) ([c282311](https://github.com/ku-cse-grad-proj/AIew/commit/c28231198073a2c0e927e205f6f64684f313900d))
* **deps:** bump langchain-core in /apps/ai-server ([#124](https://github.com/ku-cse-grad-proj/AIew/issues/124)) ([fee40b4](https://github.com/ku-cse-grad-proj/AIew/commit/fee40b4b48e9aade9ed844a0997efd196af08754))
* **deps:** bump next from 15.3.4 to 15.4.7 ([#49](https://github.com/ku-cse-grad-proj/AIew/issues/49)) ([fa272a2](https://github.com/ku-cse-grad-proj/AIew/commit/fa272a2b0b88237bf583591ae879507a91cd5892))
* **deps:** bump starlette from 0.46.2 to 0.47.2 in /apps/ai-server ([#12](https://github.com/ku-cse-grad-proj/AIew/issues/12)) ([e3844d6](https://github.com/ku-cse-grad-proj/AIew/commit/e3844d6582c55cd6747f8e7d9b51de26d76e3b47))
* **deps:** bump starlette from 0.46.2 to 0.49.1 in /apps/ai-server ([#100](https://github.com/ku-cse-grad-proj/AIew/issues/100)) ([8ea0228](https://github.com/ku-cse-grad-proj/AIew/commit/8ea0228c3fc38f191484b5da84e6591de9ed8cbb))
* **deps:** bump urllib3 from 2.5.0 to 2.6.0 in /apps/ai-server ([#143](https://github.com/ku-cse-grad-proj/AIew/issues/143)) ([d809862](https://github.com/ku-cse-grad-proj/AIew/commit/d80986275396706de9b3766658afcf50ea0c6e71))
* **deps:** bump werkzeug from 3.1.3 to 3.1.4 in /apps/ai-server ([#135](https://github.com/ku-cse-grad-proj/AIew/issues/135)) ([817f78d](https://github.com/ku-cse-grad-proj/AIew/commit/817f78db073ad93d38b22bd7fcc3ae584b3bbcf4))
* **deps:** next 16.0.10으로 update ([#144](https://github.com/ku-cse-grad-proj/AIew/issues/144)) ([8bb1f04](https://github.com/ku-cse-grad-proj/AIew/commit/8bb1f0432c85a7e2a4d470450a80f02686c5e947))
* **deps:** pnpm audit --fix 실행 ([7899542](https://github.com/ku-cse-grad-proj/AIew/commit/78995421a189cb1c29da4add52a21574c2764fae))
* **deps:** Starlette 보안 취약점 회피를 위해 FastAPI 버전 업그레이드 ([92059c0](https://github.com/ku-cse-grad-proj/AIew/commit/92059c0bb4ba82711c17c9bec0e51bc4055857d0))
* develop을 main으로 머지 ([591e794](https://github.com/ku-cse-grad-proj/AIew/commit/591e794abca48e69c69a4a1aec10e8223b476ff8))
* release 1.1.0 ([#148](https://github.com/ku-cse-grad-proj/AIew/issues/148)) ([6c7c106](https://github.com/ku-cse-grad-proj/AIew/commit/6c7c10669e0d591b5a85b4873d472cadc744d0b1))
* release 2025-12-01 ([5d1460b](https://github.com/ku-cse-grad-proj/AIew/commit/5d1460bf0bb41e10dd45a75fd6ec95a767c879b9))
* release 2025-12-03_23:02 ([67a747d](https://github.com/ku-cse-grad-proj/AIew/commit/67a747dad3370f02b7dd7c2f2ce951c381c0152f))
* release 2025-12-04_12:14 ([0584767](https://github.com/ku-cse-grad-proj/AIew/commit/0584767ff928ae60dcc231da9e8707f9fad297f1))
* release 2025-12-06_19:48 ([989223f](https://github.com/ku-cse-grad-proj/AIew/commit/989223f7cc426be44839f5cbf9439022fc874501))
* release 2025-12-12_16:54 ([dc45d04](https://github.com/ku-cse-grad-proj/AIew/commit/dc45d045044cc29590039ed98eb195f3e1c1b3ea))
* release 2025-12-17_15:47 ([3f7a8d5](https://github.com/ku-cse-grad-proj/AIew/commit/3f7a8d5036b2c531194007672b32c112cc979807))
* **repo:** bootstrap monorepo with Fastify + Next.js + FastAPI skeleton ([678a547](https://github.com/ku-cse-grad-proj/AIew/commit/678a5475612c62bfa748d6161f7e205d15c6c8d9))

## [1.1.0](https://github.com/ku-cse-grad-proj/AIew/compare/aiew-v1.0.0...aiew-v1.1.0) (2025-12-17)


### Features

* **ai:** evaluation ([#36](https://github.com/ku-cse-grad-proj/AIew/issues/36)) ([bd6223f](https://github.com/ku-cse-grad-proj/AIew/commit/bd6223fd4974ae7b7192193291887407ceda2321))
* **ai:** refactor evaluation models and add session evaluation functionality ([#69](https://github.com/ku-cse-grad-proj/AIew/issues/69)) ([7dbaa75](https://github.com/ku-cse-grad-proj/AIew/commit/7dbaa755f09423fc97286850e6fd8986237ea9d6))
* release-please 도입 ([#147](https://github.com/ku-cse-grad-proj/AIew/issues/147)) ([9f94267](https://github.com/ku-cse-grad-proj/AIew/commit/9f942679585a96fed39ca484b4bafbce09eded30))
* **repo:** setup CI, linting, formatting, git hook ([d5f60ce](https://github.com/ku-cse-grad-proj/AIew/commit/d5f60ce50d48ac78c2e3792635a1e89582f3f491))


### Bug Fixes

* **ai-server:** update Python version to 3.11 and remove exceptiongroup dependency ([f5c771f](https://github.com/ku-cse-grad-proj/AIew/commit/f5c771f611eafa1129c6d7a71997de96ade3320d))
* **ai:** Fix criteria field name in question generation prompt ([83ad9a5](https://github.com/ku-cse-grad-proj/AIew/commit/83ad9a58ac1709903731f30e1b8e360b745ed4eb))
* **ai:** update evaluation model to remove tail question ([#75](https://github.com/ku-cse-grad-proj/AIew/issues/75)) ([5f6d3b6](https://github.com/ku-cse-grad-proj/AIew/commit/5f6d3b6b50a00bf806e44f2f15b97be093fb9ffd))
* **ci:** github actions의 pnpm 버전 충돌 해결 및 husky 설정 업데이트 ([f3e79d6](https://github.com/ku-cse-grad-proj/AIew/commit/f3e79d68e580fc3786f5043bad07f7241750c958))
* **ci:** Lint, Build 오류 수정 ([ca0dbc6](https://github.com/ku-cse-grad-proj/AIew/commit/ca0dbc64373565bef4b1ae31a345a70583ea8317))
* **ci:** pnpm 버전 충돌 및 테스트 스크립트 glob 문제 해결 ([d53bd9a](https://github.com/ku-cse-grad-proj/AIew/commit/d53bd9a7b2af795f78c4eef2fe08ecaa07131a40))
* **scripts:** update quotes in dev script for consistency ([bc62080](https://github.com/ku-cse-grad-proj/AIew/commit/bc62080127337d81fe55c9a0d0a0294a5c699409))


### Documentation

* **contributing:** add corepack setup instructions ([4d3c47d](https://github.com/ku-cse-grad-proj/AIew/commit/4d3c47d767105fc63bc2ab52913102b71b69900c))
* update pr template for frontend ([58fe3f2](https://github.com/ku-cse-grad-proj/AIew/commit/58fe3f2adb4674f613e5dd012ae2e33e0d2d7aac))


### Chores

* **ci:** free disk space 작업 추가 ([#115](https://github.com/ku-cse-grad-proj/AIew/issues/115)) ([ed44c85](https://github.com/ku-cse-grad-proj/AIew/commit/ed44c8505f5b04c0db1306af233a4039ddaf5716))
* **deps, ci, husky:** automate poetry lock and update CI/pre-commit ([4a110fb](https://github.com/ku-cse-grad-proj/AIew/commit/4a110fbd43950156895374f0d39832335b51f34c))
* **deps:** bump axios from 1.10.0 to 1.11.0 ([#11](https://github.com/ku-cse-grad-proj/AIew/issues/11)) ([28a1ffa](https://github.com/ku-cse-grad-proj/AIew/commit/28a1ffa4ec7e4c765992e81a55c8f8a21480be43))
* **deps:** bump filelock from 3.20.0 to 3.20.1 in /apps/ai-server ([#146](https://github.com/ku-cse-grad-proj/AIew/issues/146)) ([bbf53ef](https://github.com/ku-cse-grad-proj/AIew/commit/bbf53efbbb48ac5d4ad7404bab11c8b819d64b81))
* **deps:** bump fonttools from 4.60.1 to 4.61.0 in /apps/ai-server ([#136](https://github.com/ku-cse-grad-proj/AIew/issues/136)) ([600d869](https://github.com/ku-cse-grad-proj/AIew/commit/600d869528a3f9bab722a31a7c73f5c50674d887))
* **deps:** bump keras from 3.11.3 to 3.12.0 in /apps/ai-server ([#101](https://github.com/ku-cse-grad-proj/AIew/issues/101)) ([c282311](https://github.com/ku-cse-grad-proj/AIew/commit/c28231198073a2c0e927e205f6f64684f313900d))
* **deps:** bump langchain-core in /apps/ai-server ([#124](https://github.com/ku-cse-grad-proj/AIew/issues/124)) ([fee40b4](https://github.com/ku-cse-grad-proj/AIew/commit/fee40b4b48e9aade9ed844a0997efd196af08754))
* **deps:** bump next from 15.3.4 to 15.4.7 ([#49](https://github.com/ku-cse-grad-proj/AIew/issues/49)) ([fa272a2](https://github.com/ku-cse-grad-proj/AIew/commit/fa272a2b0b88237bf583591ae879507a91cd5892))
* **deps:** bump starlette from 0.46.2 to 0.47.2 in /apps/ai-server ([#12](https://github.com/ku-cse-grad-proj/AIew/issues/12)) ([e3844d6](https://github.com/ku-cse-grad-proj/AIew/commit/e3844d6582c55cd6747f8e7d9b51de26d76e3b47))
* **deps:** bump starlette from 0.46.2 to 0.49.1 in /apps/ai-server ([#100](https://github.com/ku-cse-grad-proj/AIew/issues/100)) ([8ea0228](https://github.com/ku-cse-grad-proj/AIew/commit/8ea0228c3fc38f191484b5da84e6591de9ed8cbb))
* **deps:** bump urllib3 from 2.5.0 to 2.6.0 in /apps/ai-server ([#143](https://github.com/ku-cse-grad-proj/AIew/issues/143)) ([d809862](https://github.com/ku-cse-grad-proj/AIew/commit/d80986275396706de9b3766658afcf50ea0c6e71))
* **deps:** bump werkzeug from 3.1.3 to 3.1.4 in /apps/ai-server ([#135](https://github.com/ku-cse-grad-proj/AIew/issues/135)) ([817f78d](https://github.com/ku-cse-grad-proj/AIew/commit/817f78db073ad93d38b22bd7fcc3ae584b3bbcf4))
* **deps:** next 16.0.10으로 update ([#144](https://github.com/ku-cse-grad-proj/AIew/issues/144)) ([8bb1f04](https://github.com/ku-cse-grad-proj/AIew/commit/8bb1f0432c85a7e2a4d470450a80f02686c5e947))
* **deps:** pnpm audit --fix 실행 ([7899542](https://github.com/ku-cse-grad-proj/AIew/commit/78995421a189cb1c29da4add52a21574c2764fae))
* **deps:** Starlette 보안 취약점 회피를 위해 FastAPI 버전 업그레이드 ([92059c0](https://github.com/ku-cse-grad-proj/AIew/commit/92059c0bb4ba82711c17c9bec0e51bc4055857d0))
* release 2025-12-01 ([5d1460b](https://github.com/ku-cse-grad-proj/AIew/commit/5d1460bf0bb41e10dd45a75fd6ec95a767c879b9))
* release 2025-12-03_23:02 ([67a747d](https://github.com/ku-cse-grad-proj/AIew/commit/67a747dad3370f02b7dd7c2f2ce951c381c0152f))
* release 2025-12-04_12:14 ([0584767](https://github.com/ku-cse-grad-proj/AIew/commit/0584767ff928ae60dcc231da9e8707f9fad297f1))
* **repo:** bootstrap monorepo with Fastify + Next.js + FastAPI skeleton ([678a547](https://github.com/ku-cse-grad-proj/AIew/commit/678a5475612c62bfa748d6161f7e205d15c6c8d9))
