import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { isDirector } from '@/utils/roles';
import { WorkerHome } from '@/screens/home/WorkerHome';
import { DirectorHome } from '@/screens/home/DirectorHome';
import { LeaderHome } from '@/screens/home/LeaderHome';
import { teamApi, TeamRoster } from '@/api/team';

// Trang chủ theo nhóm: Giám đốc (quyền "Báo cáo giám đốc" hoặc Admin) → tổng quan;
// Tổ trưởng (tablet của tổ, chốt 2026-11-21) → tổng quan hôm nay của cả tổ; còn lại → việc hôm nay
export function DashboardScreen() {
  const { user } = useAuthStore();
  const director = isDirector(user);
  // undefined = đang kiểm tra; null = không phải tổ trưởng
  const [team, setTeam] = React.useState<TeamRoster | null | undefined>(director ? null : undefined);
  React.useEffect(() => {
    if (director) return;
    let ok = true;
    teamApi.roster().then((r) => ok && setTeam(r)).catch(() => ok && setTeam(null));
    return () => { ok = false; };
  }, [director, user?.id]);

  if (director) return <DirectorHome />;
  if (team === undefined) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  return team ? <LeaderHome initial={team} /> : <WorkerHome />;
}
