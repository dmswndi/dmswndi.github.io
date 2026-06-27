# 🐾 PET SALON — 애견미용 그루밍 포토 포트폴리오

흑백 사진 + 레드 포인트 감성의 사진 위주 포트폴리오 웹사이트입니다.
빌드 도구 없이 동작하는 **순수 HTML/CSS/JS** 정적 사이트이며,
**GitHub Pages**로 무료 호스팅하고, `사이트주소/admin`에서 비개발자도 사진을 올릴 수 있습니다.

---

## 📁 폴더 구조

```
photoWeb/
├── index.html          # 메인 페이지 (4개 섹션: Home / Gallery / Services / Contact)
├── css/style.css       # 디자인 시스템 (흑백 + 레드)
├── js/main.js          # 풀페이지 전환 · 갤러리 · 애니메이션
├── data/gallery.json   # 갤러리 사진 목록 (admin이 편집하는 파일)
├── images/
│   ├── brand/          # 로고 등 고정 이미지
│   └── gallery/        # 그루밍 사진 (admin 업로드 위치)
├── admin/              # 사진 관리 페이지 (Decap CMS)
│   ├── index.html
│   └── config.yml
└── README.md
```

---

## 🖥️ 1. 로컬에서 미리보기

브라우저로 `index.html`을 직접 열면 갤러리(`gallery.json` 불러오기)가 보안정책에 막힙니다.
**작은 로컬 서버**로 띄워야 정상 동작합니다.

```bash
cd photoWeb
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속.

조작법: 마우스 휠 / 위·아래 방향키 / 모바일은 위아래 스와이프 → 섹션 전환.
갤러리는 좌우로 넘기고, 사진을 클릭하면 확대됩니다.

---

## 🚀 2. GitHub Pages로 배포 (무료)

### 2-1. 저장소 만들기
1. [github.com](https://github.com) 로그인 → 우측 상단 **+** → **New repository**.
2. 저장소 이름을 **`내아이디.github.io`** 로 만들면 주소가 `https://내아이디.github.io` 로 깔끔합니다.
   (다른 이름으로 만들면 주소는 `https://내아이디.github.io/저장소이름` 이 됩니다.)
3. **Create repository**.

### 2-2. 파일 올리기 (Git 몰라도 OK)
- 저장소 페이지 → **Add file ▸ Upload files** → 이 폴더의 파일들을 끌어다 놓기 → **Commit changes**.
  (또는 Git에 익숙하면 `git push` 사용)

### 2-3. Pages 켜기
- 저장소 **Settings ▸ Pages** → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → **Save**.
- 1~2분 뒤 위에서 정한 주소로 사이트가 뜹니다.

---

## 🔐 3. 사진 관리 admin 켜기 (1회 설정)

`사이트주소/admin` 에서 로그인해 사진을 올리려면, GitHub Pages는 정적이라
**로그인 처리를 대신해주는 무료 인증 도우미(OAuth 프록시)**가 필요합니다.

> 이 설정은 **딱 한 번**만 하면 됩니다. 이후엔 admin에서 클릭만으로 사진 업로드 가능.

### 3-1. GitHub OAuth 앱 등록
1. GitHub → **Settings ▸ Developer settings ▸ OAuth Apps ▸ New OAuth App**.
2. 입력:
   - **Application name**: `Pet Salon CMS` (자유)
   - **Homepage URL**: `https://내아이디.github.io`
   - **Authorization callback URL**: `https://<인증도우미주소>/callback`
     (다음 단계에서 정해지는 Worker 주소. 우선 임시로 두고 나중에 수정해도 됨)
3. 등록 후 **Client ID** 확인, **Generate a new client secret** 으로 **Client Secret** 발급 → 둘 다 복사해 둡니다.

### 3-2. Cloudflare Worker로 인증 도우미 배포 (무료)
1. [dash.cloudflare.com](https://dash.cloudflare.com) 무료 가입 → **Workers & Pages ▸ Create**.
2. GitHub OAuth용 공개 워커 코드를 사용합니다. 검색어:
   **"decap cms github oauth cloudflare worker"** (예: `decap-proxy`, `sterlingwes/decap-proxy` 등).
3. 워커에 **환경 변수**로 위에서 받은 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 입력 후 **Deploy**.
4. 배포되면 주소가 나옵니다: `https://<이름>.<계정>.workers.dev`
5. 3-1의 **Authorization callback URL** 을 `https://<이름>.<계정>.workers.dev/callback` 로 맞춰 저장.

### 3-3. `admin/config.yml` 값 채우기
`admin/config.yml` 을 열어 아래를 본인 값으로 수정 후 다시 업로드(Commit):
```yaml
backend:
  name: github
  repo: 내아이디/저장소이름          # 예: hong/hong.github.io
  branch: main
  base_url: https://<이름>.<계정>.workers.dev
  auth_endpoint: /auth
```

### 3-4. 완료
`https://내아이디.github.io/admin` 접속 → **Login with GitHub** → 끝!

---

## 🖼️ 4. 사진 올리는 법 (관리자 일상 사용)

1. `사이트주소/admin` 접속 → GitHub 로그인.
2. **갤러리 사진 ▸ 갤러리 목록** 열기.
3. **추가** 버튼 → 사진 업로드 + 설명(캡션) 입력 + 분류 선택(그루밍 전/후/스타일).
4. 드래그로 **순서 변경** 가능.
5. 우측 상단 **Publish(게시)** → 잠시 후 사이트 갤러리에 자동 반영됩니다.

> admin이 부담스러우면: 저장소의 `images/gallery/` 에 사진을 업로드하고
> `data/gallery.json` 에 항목을 추가해도 됩니다. (admin 없이도 동작)

---

## ✏️ 5. 내용 바꾸기

| 바꿀 것 | 위치 |
|--------|------|
| 브랜드명(PET SALON), 헤드라인, 카피 | `index.html` 의 각 `<section>` |
| 전화번호 · 이메일 · 인스타 · 주소 | `index.html` 의 `.contact-list`, `tel:` 링크 |
| 색상(레드 포인트 등) · 폰트 | `css/style.css` 상단 `:root` 변수 |
| 대표(Hero) 사진 | `index.html` 의 `.hero-photo img` 의 `src` |

샘플 사진은 `picsum.photos` 무료 임의 이미지입니다. 실제 그루밍 사진으로 교체하세요.

---

## 🧩 사용 라이브러리 (모두 무료 · 상업적 사용 가능)

- [Swiper](https://swiperjs.com) — 섹션/갤러리 전환 (MIT)
- [GSAP](https://gsap.com) — 진입 애니메이션
- [GLightbox](https://biati-digital.github.io/glightbox/) — 사진 확대 (MIT)
- [Decap CMS](https://decapcms.org) — 사진 관리 admin (MIT)

모두 CDN으로 불러오므로 별도 설치가 필요 없습니다.
