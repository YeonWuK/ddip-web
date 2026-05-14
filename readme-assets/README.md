# README용 화면 캡처

루트 [`README.md`](../README.md)의 **「주요 화면」**에 쓰는 이미지입니다.  
현재 저장소에는 **회색 플레이스홀더 PNG**가 들어 있으니, 로컬에서 서버를 띄운 뒤 **같은 파일명으로 실제 화면을 덮어 저장**하면 GitHub에서 바로 반영됩니다.

## 파일명 ↔ 화면

| 파일명 | 권장 캡처 내용 |
|--------|------------------|
| `screen-home.png` | 메인 홈(히어로·큐레이션) |
| `screen-projects.png` | 프로젝트 목록 + 필터·무한 스크롤 |
| `screen-auction-detail.png` | 경매 상세(입찰·내역) |
| `screen-search.png` | 통합 검색 결과 |
| `screen-profile.png` | 마이페이지 탭 중 한 화면 |
| `screen-admin.png` | 관리자 페이지(민감 정보는 가리기) |

## 캡처 팁

- 가로 **약 1280px**면 README에서 읽기 좋습니다.
- **개인정보·실제 연락처·주소**는 모자이크하거나 개발용 계정으로 촬영하세요.
- Windows: `Win + Shift + S`로 영역 캡처 후, 위 파일명으로 `readme-assets`에 저장합니다.

```powershell
# 예: 프로젝트 루트에서
git add readme-assets/*.png
git commit -m "docs: README용 실제 화면 캡처"
```
