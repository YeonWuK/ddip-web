"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/contexts/auth-context";
import { Navigation } from "@/src/components/navigation";
import { adminApi } from "@/src/services/adminService";
import type { AdminUserSummaryDto, AdminProjectSummaryDto, AdminAuctionSummaryDto, AdminUserDetailDto } from "@/src/types/api";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Separator } from "@/src/components/ui/separator";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Shield,
  Users,
  FileText,
  Gavel,
  TrendingUp,
  DollarSign,
  Clock,
  Search,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Coins,
  StopCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Zap,
  Activity,
  Calendar,
  Target,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // 통계
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalAuctions: 0,
    pendingProjects: 0,
    activeUsers: 0,
  });

  // 데이터
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([]);
  const [projects, setProjects] = useState<AdminProjectSummaryDto[]>([]);
  const [auctions, setAuctions] = useState<AdminAuctionSummaryDto[]>([]);

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // 페이징
  const [userPage, setUserPage] = useState(0);
  const [projectPage, setProjectPage] = useState(0);
  const [auctionPage, setAuctionPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [projectTotalPages, setProjectTotalPages] = useState(0);
  const [auctionTotalPages, setAuctionTotalPages] = useState(0);

  // 검색
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [auctionSearch, setAuctionSearch] = useState("");

  // 다이얼로그
  const [selectedUser, setSelectedUser] = useState<AdminUserSummaryDto | null>(null);
  const [selectedProject, setSelectedProject] = useState<AdminProjectSummaryDto | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<AdminAuctionSummaryDto | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'point' | 'sms' | 'stop' | 'cancel' | null;
    reason: string;
    amount: string;
  }>({
    open: false,
    type: null,
    reason: '',
    amount: '',
  });

  // 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast.error("관리자만 접근할 수 있습니다");
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadAllData();
    }
  }, [isAuthenticated, user]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        loadUsers(),
        loadProjects(),
        loadAuctions(),
      ]);
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        failed.forEach((r) => r.status === 'rejected' && console.error('데이터 로드 실패:', r.reason));
        const failedNames = results
          .map((r, i) => (r.status === 'rejected' ? ['유저', '프로젝트', '경매'][i] : null))
          .filter(Boolean);
        toast.error(`${failedNames.join(', ')} 데이터를 불러오는데 실패했습니다`);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 유저 목록 로드
  const loadUsers = async (page = 0) => {
    try {
      const condition = userSearch ? { nickname: userSearch } : undefined;
      const response = await adminApi.getUserList(condition, page, 20);
      setUsers(response.content);
      setUserTotalPages(response.totalPages);
      setUserPage(page);

      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        totalUsers: response.totalElements,
        activeUsers: response.content.filter(u => u.active).length,
      }));
    } catch (error) {
      console.error("유저 목록 로드 실패:", error);
    }
  };

  // 프로젝트 목록 로드
  const loadProjects = async (page = 0) => {
    try {
      const condition = projectSearch ? { title: projectSearch } : undefined;
      const response = await adminApi.getProjectList(condition, page, 20);
      setProjects(response.content);
      setProjectTotalPages(response.totalPages);
      setProjectPage(page);

      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        totalProjects: response.totalElements,
        pendingProjects: response.content.filter(p => p.status === 'DRAFT').length,
      }));
    } catch (error) {
      console.error("프로젝트 목록 로드 실패:", error);
    }
  };

  // 경매 목록 로드
  const loadAuctions = async (page = 0) => {
    try {
      const condition = auctionSearch ? { title: auctionSearch } : undefined;
      const response = await adminApi.getAuctionList(condition, page, 20);
      setAuctions(response.content);
      setAuctionTotalPages(response.totalPages);
      setAuctionPage(page);

      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        totalAuctions: response.totalElements,
      }));
    } catch (error) {
      console.error("경매 목록 로드 실패:", error);
    }
  };

  // 프로젝트 승인
  const handleApproveProject = async () => {
    if (!selectedProject) return;
    try {
      await adminApi.approveProject(selectedProject.id);
      toast.success("프로젝트가 승인되었습니다");
      setActionDialog({ ...actionDialog, open: false });
      loadProjects(projectPage);
    } catch (error) {
      toast.error("승인에 실패했습니다");
    }
  };

  // 프로젝트 거절
  const handleRejectProject = async () => {
    if (!selectedProject || !actionDialog.reason) {
      toast.error("거절 사유를 입력하세요");
      return;
    }
    try {
      await adminApi.rejectProject(selectedProject.id, actionDialog.reason);
      toast.success("프로젝트가 거절되었습니다");
      setActionDialog({ ...actionDialog, open: false, reason: '' });
      loadProjects(projectPage);
    } catch (error) {
      toast.error("거절에 실패했습니다");
    }
  };

  // 프로젝트 강제 정지
  const handleStopProject = async () => {
    if (!selectedProject || !actionDialog.reason) {
      toast.error("정지 사유를 입력하세요");
      return;
    }
    try {
      await adminApi.forceStopProject(selectedProject.id, actionDialog.reason);
      toast.success("프로젝트가 정지되었습니다");
      setActionDialog({ ...actionDialog, open: false, reason: '' });
      loadProjects(projectPage);
    } catch (error) {
      toast.error("정지에 실패했습니다");
    }
  };

  // 포인트 조정
  const handleAdjustPoint = async () => {
    const adjustPoint = Number(actionDialog.amount);

    if (!selectedUser || !actionDialog.reason || !actionDialog.amount || Number.isNaN(adjustPoint) || adjustPoint === 0) {
      toast.error("포인트와 사유를 입력하세요");
      return;
    }
    try {
      await adminApi.adjustUserPoint({
        userId: selectedUser.id,
        adjustPoint,
        reason: actionDialog.reason,
      });
      toast.success("포인트가 조정되었습니다");
      setActionDialog({ ...actionDialog, open: false, reason: '', amount: '' });
      loadUsers(userPage);
    } catch (error) {
      toast.error("포인트 조정에 실패했습니다");
    }
  };

  // 경매 강제 종료
  const handleForceCloseAuction = async () => {
    if (!selectedAuction || !actionDialog.reason) {
      toast.error("종료 사유를 입력하세요");
      return;
    }
    try {
      await adminApi.forceCloseAuction(selectedAuction.id, actionDialog.reason);
      toast.success("경매가 강제 종료되었습니다");
      setActionDialog({ ...actionDialog, open: false, reason: '' });
      loadAuctions(auctionPage);
    } catch (error) {
      toast.error("강제 종료에 실패했습니다");
    }
  };

  // 프로젝트 강제 취소
  const handleForceCancelProject = async () => {
    if (!selectedProject || !actionDialog.reason) {
      toast.error("취소 사유를 입력하세요");
      return;
    }
    try {
      await adminApi.forceCancelProject(selectedProject.id, actionDialog.reason);
      toast.success("프로젝트가 강제 취소되었습니다");
      setActionDialog({ ...actionDialog, open: false, reason: '' });
      loadProjects(projectPage);
    } catch (error) {
      toast.error("강제 취소에 실패했습니다");
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
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
            <Shield className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground">DDIP 플랫폼 전체 관리 시스템</p>
          </div>
        </div>
        <Button onClick={loadAllData} variant="outline" size="sm">
          <RefreshCw className="mr-2 size-4" />
          새로고침
        </Button>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <TrendingUp className="mr-2 size-4" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FileText className="mr-2 size-4" />
            프로젝트
            {stats.pendingProjects > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingProjects}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auctions">
            <Gavel className="mr-2 size-4" />
            경매
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 size-4" />
            사용자
          </TabsTrigger>
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 주요 지표 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                <Users className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  활성: {stats.activeUsers}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 프로젝트</CardTitle>
                <FileText className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  승인 대기: {stats.pendingProjects}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 경매</CardTitle>
                <Gavel className="size-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAuctions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">경매 관리</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
                <Activity className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">정상</div>
                <p className="text-xs text-muted-foreground">모든 서비스 운영 중</p>
              </CardContent>
            </Card>
          </div>

          {/* 승인 대기 알림 */}
          {stats.pendingProjects > 0 && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertTriangle className="size-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                승인 대기 중인 프로젝트가 <strong>{stats.pendingProjects}개</strong> 있습니다.
                <Button
                  variant="link"
                  className="ml-2 h-auto p-0 text-orange-600"
                  onClick={() => setActiveTab("projects")}
                >
                  지금 확인하기 →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* 최근 활동 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  최근 등록 프로젝트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{project.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.creatorNickname ?? project.creator?.nickname ?? `ID: ${project.creatorId}`}
                        </p>
                      </div>
                      <Badge variant={project.status === 'DRAFT' ? 'destructive' : 'outline'}>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5" />
                  최근 등록 경매
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auctions.slice(0, 5).map((auction) => (
                    <div key={auction.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{auction.title}</p>
                        <p className="text-xs text-muted-foreground">{auction.sellerUsername}</p>
                      </div>
                      <Badge variant={auction.auctionStatus === 'RUNNING' ? 'default' : 'outline'}>
                        {auction.auctionStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 프로젝트 관리 탭 */}
        <TabsContent value="projects" className="space-y-6">
          {/* 검색 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    placeholder="프로젝트 제목 검색..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => loadProjects(0)}>
                  <Search className="mr-2 size-4" />
                  검색
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 프로젝트 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 목록 ({projects.length}개)</CardTitle>
              <CardDescription>프로젝트 승인/거절 및 관리</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  프로젝트가 없습니다
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg truncate">{project.title}</h3>
                              <Badge variant={
                                project.status === 'DRAFT' ? 'destructive' :
                                project.status === 'OPEN' ? 'default' :
                                project.status === 'SUCCESS' ? 'default' : 'outline'
                              }>
                                {project.status}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Users className="size-4" />
                                {(() => {
                                  const creatorNickname =
                                    project.creatorNickname ?? project.creator?.nickname ?? `ID: ${project.creatorId}`;
                                  const creatorIdentity =
                                    project.creatorUsername ?? project.creator?.email ?? "";

                                  return (
                                    <>
                                      생성자: <strong>{creatorNickname}</strong>
                                      {creatorIdentity ? ` (${creatorIdentity})` : ""}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className="size-4" />
                                목표: <strong>{project.targetAmount.toLocaleString()}원</strong> / 
                                현재: {project.currentAmount.toLocaleString()}원 
                                ({project.targetAmount > 0 
                                  ? Math.round((project.currentAmount / project.targetAmount) * 100) 
                                  : 0}%)
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="size-4" />
                                기간: {new Date(project.startAt).toLocaleDateString()} ~ {new Date(project.endAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/project/${project.id}`}>
                                <ExternalLink className="mr-1 size-4" />
                                상세
                              </Link>
                            </Button>
                            {/* 상태별로 가능한 액션만 표시 */}
                            {(project.status === 'DRAFT' || project.status === 'OPEN') && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {project.status === 'DRAFT' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedProject(project);
                                          setActionDialog({ open: true, type: 'approve', reason: '', amount: '' });
                                        }}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="mr-2 size-4" />
                                        승인
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedProject(project);
                                          setActionDialog({ open: true, type: 'reject', reason: '', amount: '' });
                                        }}
                                        className="text-red-600"
                                      >
                                        <XCircle className="mr-2 size-4" />
                                        거절
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {project.status === 'OPEN' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedProject(project);
                                          setActionDialog({ open: true, type: 'stop', reason: '', amount: '' });
                                        }}
                                        className="text-orange-600"
                                      >
                                        <StopCircle className="mr-2 size-4" />
                                        강제 정지
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedProject(project);
                                          setActionDialog({ open: true, type: 'cancel', reason: '', amount: '' });
                                        }}
                                        className="text-red-600"
                                      >
                                        <XCircle className="mr-2 size-4" />
                                        강제 취소
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {/* 이미 종료된 상태는 액션 없음 */}
                            {(project.status === 'SUCCESS' || project.status === 'FAILED' || 
                              project.status === 'CANCELED' || project.status === 'REJECTED' || 
                              project.status === 'STOP') && (
                              <Badge variant="outline" className="text-muted-foreground">
                                조치 완료
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {projectTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadProjects(projectPage - 1)}
                        disabled={projectPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {projectPage + 1} / {projectTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadProjects(projectPage + 1)}
                        disabled={projectPage >= projectTotalPages - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 경매 관리 탭 */}
        <TabsContent value="auctions" className="space-y-6">
          {/* 검색 */}
          <Card>
            <CardHeader>
              <CardTitle>경매 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    placeholder="경매 제목 검색..."
                    value={auctionSearch}
                    onChange={(e) => setAuctionSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => loadAuctions(0)}>
                  <Search className="mr-2 size-4" />
                  검색
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 경매 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>경매 목록 ({auctions.length}개)</CardTitle>
              <CardDescription>경매 강제 종료 및 취소</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : auctions.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  경매가 없습니다
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {auctions.map((auction) => (
                      <div key={auction.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg truncate">{auction.title}</h3>
                              <Badge variant={auction.auctionStatus === 'RUNNING' ? 'default' : 'outline'}>
                                {auction.auctionStatus}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <div>판매자: <strong>{auction.sellerUsername}</strong></div>
                              <div>
                                시작가: {auction.startPrice.toLocaleString()}원 / 
                                현재가: <strong>{auction.currentPrice.toLocaleString()}원</strong>
                              </div>
                              {auction.currentWinnerUsername && (
                                <div>현재 최고 입찰자: <strong>{auction.currentWinnerUsername}</strong></div>
                              )}
                              <div>종료: {new Date(auction.endAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/auction/${auction.id}`}>
                                <ExternalLink className="mr-1 size-4" />
                                상세
                              </Link>
                            </Button>
                            {/* RUNNING 상태만 강제 종료 가능 */}
                            {auction.auctionStatus === 'RUNNING' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedAuction(auction);
                                  setActionDialog({ open: true, type: 'stop', reason: '', amount: '' });
                                }}
                              >
                                <StopCircle className="mr-1 size-4" />
                                강제 종료
                              </Button>
                            )}
                            {/* 이미 종료된 경매는 액션 없음 */}
                            {(auction.auctionStatus === 'ENDED' || auction.auctionStatus === 'CANCELED') && (
                              <Badge variant="outline" className="text-muted-foreground">
                                종료됨
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {auctionTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadAuctions(auctionPage - 1)}
                        disabled={auctionPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {auctionPage + 1} / {auctionTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadAuctions(auctionPage + 1)}
                        disabled={auctionPage >= auctionTotalPages - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="space-y-6">
          {/* 검색 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    placeholder="닉네임 검색..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => loadUsers(0)}>
                  <Search className="mr-2 size-4" />
                  검색
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록 ({users.length}개)</CardTitle>
              <CardDescription>사용자 포인트 조정 및 관리</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  사용자가 없습니다
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                              {u.nickname[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold truncate">{u.nickname}</span>
                                {u.role === 'ADMIN' && (
                                  <Badge variant="destructive" className="shrink-0">
                                    <Shield className="mr-1 size-3" />
                                    ADMIN
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>{u.email}</div>
                                <div className="flex items-center gap-2">
                                  <Coins className="size-4" />
                                  포인트: <strong>{u.pointBalance.toLocaleString()}P</strong>
                                </div>
                                <div>가입일: {new Date(u.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(u);
                                setActionDialog({ open: true, type: 'point', reason: '', amount: '' });
                              }}
                            >
                              <Coins className="mr-1 size-4" />
                              포인트
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {userTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadUsers(userPage - 1)}
                        disabled={userPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {userPage + 1} / {userTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadUsers(userPage + 1)}
                        disabled={userPage >= userTotalPages - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 액션 다이얼로그 */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' && '프로젝트 승인'}
              {actionDialog.type === 'reject' && '프로젝트 거절'}
              {actionDialog.type === 'point' && '포인트 조정'}
              {actionDialog.type === 'stop' && '강제 종료/정지'}
              {actionDialog.type === 'cancel' && '강제 취소'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' && '이 프로젝트를 승인하시겠습니까?'}
              {actionDialog.type === 'reject' && '이 프로젝트를 거절하시겠습니까? 거절 사유를 입력해주세요.'}
              {actionDialog.type === 'point' && '사용자의 포인트를 조정합니다. 양수는 지급, 음수는 차감입니다.'}
              {actionDialog.type === 'stop' && '강제로 종료/정지하시겠습니까? 사유를 입력해주세요.'}
              {actionDialog.type === 'cancel' && '강제로 취소하시겠습니까? 환불이 처리됩니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === 'point' && (
              <div className="space-y-2">
                <Label htmlFor="amount">포인트 (양수: 지급 / 음수: 차감)</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 1000 또는 -500"
                  value={actionDialog.amount}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    // 빈값/음수 부호 입력은 허용하고, 숫자는 0으로 시작하지 않도록 제한
                    if (raw === "" || raw === "-" || /^-?[1-9]\d*$/.test(raw)) {
                      setActionDialog({ ...actionDialog, amount: raw });
                    }
                  }}
                />
              </div>
            )}
            {actionDialog.type !== 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {actionDialog.type === 'point' ? '사유' : '사유 (필수)'}
                </Label>
                <Input
                  id="reason"
                  placeholder="사유를 입력하세요"
                  value={actionDialog.reason}
                  onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, open: false, reason: '', amount: '' })}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (actionDialog.type === 'approve') handleApproveProject();
                else if (actionDialog.type === 'reject') handleRejectProject();
                else if (actionDialog.type === 'point') handleAdjustPoint();
                else if (actionDialog.type === 'stop') {
                  if (selectedProject) handleStopProject();
                  else if (selectedAuction) handleForceCloseAuction();
                }
                else if (actionDialog.type === 'cancel') handleForceCancelProject();
              }}
              variant={actionDialog.type === 'approve' ? 'default' : 'destructive'}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
