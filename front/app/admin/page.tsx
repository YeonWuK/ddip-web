"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/contexts/auth-context";
import { projectApi, auctionApi, type ProjectResponse, type AuctionSummary } from "@/src/services/api";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Separator } from "@/src/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  FileText,
  Gavel,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Calendar,
  Target,
} from "lucide-react";

interface AdminStats {
  totalProjects: number;
  draftProjects: number;
  openProjects: number;
  successProjects: number;
  totalAuctions: number;
  runningAuctions: number;
  endedAuctions: number;
  totalPledgeAmount: number;
  totalCurrentAmount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalProjects: 0,
    draftProjects: 0,
    openProjects: 0,
    successProjects: 0,
    totalAuctions: 0,
    runningAuctions: 0,
    endedAuctions: 0,
    totalPledgeAmount: 0,
    totalCurrentAmount: 0,
  });
  const [draftProjects, setDraftProjects] = useState<ProjectResponse[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [allAuctions, setAllAuctions] = useState<AuctionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast.error("관리자만 접근할 수 있습니다");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [isAuthenticated, user]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);

      // 프로젝트 데이터 로드 (페이지 크기를 크게 해서 전체 조회)
      const projects = await projectApi.getProjects({ page: 1, limit: 1000 });
      const auctions = await auctionApi.getAuctions({ page: 1, limit: 1000 });

      // 통계 계산
      const draftProjs = projects.filter(p => p.status === 'DRAFT');
      const openProjs = projects.filter(p => p.status === 'OPEN');
      const successProjs = projects.filter(p => p.status === 'SUCCESS');
      const runningAucts = auctions.filter(a => a.status === 'RUNNING');
      const endedAucts = auctions.filter(a => a.status === 'ENDED');

      const totalCurrentAmount = projects.reduce((sum, p) => sum + (p.currentAmount || 0), 0);

      setStats({
        totalProjects: projects.length,
        draftProjects: draftProjs.length,
        openProjects: openProjs.length,
        successProjects: successProjs.length,
        totalAuctions: auctions.length,
        runningAuctions: runningAucts.length,
        endedAuctions: endedAucts.length,
        totalPledgeAmount: totalCurrentAmount,
        totalCurrentAmount,
      });

      setDraftProjects(draftProjs);
      setAllProjects(projects);
      setAllAuctions(auctions);
    } catch (error) {
      console.error("관리자 데이터 로드 실패:", error);
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && user?.role !== 'ADMIN')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="size-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground">플랫폼 전체 현황 모니터링</p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">통계 대시보드</TabsTrigger>
          <TabsTrigger value="projects">
            프로젝트 관리
            {stats.draftProjects > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.draftProjects}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auctions">경매 관리</TabsTrigger>
        </TabsList>

        {/* 통계 대시보드 */}
        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 주요 지표 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">전체 프로젝트</CardTitle>
                    <FileText className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProjects.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      진행중: {stats.openProjects} / 성공: {stats.successProjects}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
                    <Clock className="size-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.draftProjects.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      검토가 필요한 프로젝트
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">전체 경매</CardTitle>
                    <Gavel className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAuctions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      진행중: {stats.runningAuctions} / 종료: {stats.endedAuctions}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 후원금액</CardTitle>
                    <DollarSign className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalCurrentAmount.toLocaleString()}원
                    </div>
                    <p className="text-xs text-muted-foreground">
                      프로젝트 누적 후원액
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 승인 대기 알림 */}
              {stats.draftProjects > 0 && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    승인 대기 중인 프로젝트가 <strong>{stats.draftProjects}개</strong> 있습니다.
                    <Button
                      variant="link"
                      className="ml-2 h-auto p-0"
                      onClick={() => setActiveTab("projects")}
                    >
                      지금 확인하기 →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* 상태별 분포 */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>프로젝트 상태 분포</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">DRAFT (승인대기)</span>
                      <Badge variant="outline">{stats.draftProjects}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OPEN (진행중)</span>
                      <Badge variant="outline">{stats.openProjects}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SUCCESS (성공)</span>
                      <Badge variant="outline">{stats.successProjects}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>경매 상태 분포</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RUNNING (진행중)</span>
                      <Badge variant="outline">{stats.runningAuctions}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ENDED (종료)</span>
                      <Badge variant="outline">{stats.endedAuctions}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* 프로젝트 관리 */}
        <TabsContent value="projects" className="space-y-6">
          {/* 승인 대기 프로젝트 */}
          <Card>
            <CardHeader>
              <CardTitle>승인 대기 프로젝트 (DRAFT)</CardTitle>
              <CardDescription>
                검토가 필요한 프로젝트 목록입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : draftProjects.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  승인 대기 중인 프로젝트가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {draftProjects.map((project) => (
                    <div key={project.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                          <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="size-4" />
                              <span>생성자: <strong>{project.creator.nickname}</strong> ({project.creator.email})</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target className="size-4" />
                              <span>목표금액: <strong>{project.targetAmount.toLocaleString()}원</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="size-4" />
                              <span>
                                기간: {new Date(project.startAt).toLocaleDateString()} ~ {new Date(project.endAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-4 text-orange-600 border-orange-600">
                          {project.status}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          asChild
                          variant="outline"
                        >
                          <Link href={`/project/${project.id}`}>
                            <ExternalLink className="mr-1 size-4" />
                            상세보기
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 전체 프로젝트 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>전체 프로젝트 목록</CardTitle>
              <CardDescription>
                모든 상태의 프로젝트를 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {allProjects.slice(0, 10).map((project) => (
                    <div key={project.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.creator.nickname} • {project.currentAmount.toLocaleString()} / {project.targetAmount.toLocaleString()}원
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'OPEN' ? 'default' : 'outline'}>
                          {project.status}
                        </Badge>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/project/${project.id}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allProjects.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      외 {allProjects.length - 10}개 프로젝트
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 경매 관리 */}
        <TabsContent value="auctions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>전체 경매 목록</CardTitle>
              <CardDescription>
                모든 상태의 경매를 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {allAuctions.slice(0, 10).map((auction) => (
                    <div key={auction.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium">{auction.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          현재가: {auction.currentPrice.toLocaleString()}원 • 입찰: {auction.bidCount}회
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={auction.status === 'RUNNING' ? 'default' : 'outline'}>
                          {auction.status}
                        </Badge>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/auction/${auction.id}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allAuctions.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      외 {allAuctions.length - 10}개 경매
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
