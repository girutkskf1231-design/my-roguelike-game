# 게임 인벤토리 개선 요약 (한국어)

인벤토리 용량 표시 오류("280/200") 해결 및 Supabase 기반 클라우드 저장 도입.

- **해결**: "무제한 저장 가능" 명시, `player_inventory` 테이블·RLS, 30초 자동 저장·즉시 저장
- **효과**: 데이터 손실 방지, 멀티 디바이스 진행 상황 복구

자세한 내용: [CHANGELOG_20260130.md](./CHANGELOG_20260130.md), [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
