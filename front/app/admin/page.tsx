"use client"

import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Loader2, Users, Package, Gavel, Search, Ban, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { adminApi } from "@/src/services/api"
import { AdminUserSummaryDto, AdminProjectSummaryDto, AdminAuctionSummaryDto, PageResponse } from "@/src/types/api"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // 유저 관리
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([])
  const [usersPage, setUsersPage] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(0)
  const [userSearchEmail, setUserSearchEmail] = useState("")
  
  // 프로젝트 관리
  const [projects, setProjects] = useState<AdminProjectSummaryDto[]>([])
  const [projectsPage, setProjectsPage] = useState(0)
  const [projectsTotalPages, setProjectsTotalPages] = useState(0)
  const [projectSearchTitle, setProjectSearchTitle] = useState("")
  
  // 경매 관리
  const [auctions, setAuctions] = useState<AdminAuctionSummaryDto[]>([])
  const [auctionsPage, setAuctionsPage] = useState(0)
  const [auctionsTotalPages, setAuctionsTotalPages] = useState(0)
  const [auctionSearchTitle, setAuctionSearchTitle] = useState("")

  // 관리자 권한 체크
  useEffect(() => {
    if (!isAuthenticated) return
    if (user?.role !== 'ADMIN') {
      toast.error("관리자 권한이 필요합니다")
      window.location.href = "/"
    }
  }, [user, isAuthenticated])

  // 유저 목록 로드
  const loadUsers = async (page: number = 0) => {
    try {
      setLoading(true)
      const condition = userSearchEmail ? { email: userSearchEmail } : undefined
      const response = await adminApi.getUserList(condition, page, 20)
      setUsers(response.content)
      setUsersTotalPages(response.totalPages)
      setUsersPage(page)
    } catch (error) {
      toast.error("유저 목록을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 프로젝트 목록 로드
  const loadProjects = async (page: number = 0) => {
    try {
      setLoading(true)
      const condition = projectSearchTitle ? { title: projectSearchTitle } : undefined
      const response = await adminApi.getProjectList(condition, page, 20)
      setProjects(response.content)
      setProjectsTotalPages(response.totalPages)
      setProjectsPage(page)
    } catch (error) {
      toast.error("프로젝트 목록을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 경매 목록 로드
  const loadAuctions = async (page: number = 0) => {
    try {
      setLoading(true)
      const condition = auctionSearchTitle ? { title: auctionSearchTitle } : undefined
      const response = await adminApi.getAuctionList(condition, page, 20)
      setAuctions(response.content)
      setAuctionsTotalPages(response.totalPages)
      setAuctionsPage(page)
    } catch (error) {
      toast.error("경매 목록을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 프로젝트 승인
  const handleApproveProject = async (projectId: number) => {
    if (!confirm("이 프로젝트를 승인하시겠습니까?")) return
    try {
      await adminApi.approveProject(projectId)
      toast.success("프로젝트가 승인되었습니다")
      loadProjects(projectsPage)
    } catch (error) {
      toast.error("승인에 실패했습니다")
    }
  }

  // 프로젝트 거절
  const handleRejectProject = async (projectId: number) => {
    const reason = prompt("거절 사유를 입력하세요:")
    if (!reason) return
    try {
      await adminApi.rejectProject(projectId, reason)
      toast.success("프로젝트가 거절되었습니다")
      loadProjects(projectsPage)
    } catch (error) {
      toast.error("거절에 실패했습니다")
    }
  }

  // 프로젝트 강제 정지
  const handleForceStopProject = async (projectId: number) => {
    const reason = prompt("강제 정지 사유를 입력하세요:")
    if (!reason) return
    try {
      await adminApi.forceStopProject(projectId, reason)
      toast.success("프로젝트가 강제 정지되었습니다")
      loadProjects(projectsPage)
    } catch (error) {
      toast.error("강제 정지에 실패했습니다")
    }
  }

  // 경매 강제 종료
  const handleForceCloseAuction = async (auctionId: number) => {
    const reason = prompt("강제 종료 사유를 입력하세요:")
    if (!reason) return
    try {
      await adminApi.forceCloseAuction(auctionId, reason)
      toast.success("경매가 강제 종료되었습니다")
      loadAuctions(auctionsPage)
    } catch (error) {
      toast.error("강제 종료에 실패했습니다")
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">관리자 페이지</h1>
            <p className="text-muted-foreground">유저, 프로젝트, 경매를 관리합니다</p>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" onClick={() => loadUsers(0)}>
                <Users className="mr-2 size-4" />
                유저 관리
              </TabsTrigger>
              <TabsTrigger value="projects" onClick={() => loadProjects(0)}>
                <Package className="mr-2 size-4" />
                프로젝트 관리
              </TabsTrigger>
              <TabsTrigger value="auctions" onClick={() => loadAuctions(0)}>
                <Gavel className="mr-2 size-4" />
                경매 관리
              </TabsTrigger>
            </TabsList>

            {/* 유저 관리 탭 */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>유저 검색</CardTitle>
                  <CardDescription>이메일로 유저를 검색합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="이메일 입력..."
                      value={userSearchEmail}
                      onChange={(e) => setUserSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadUsers(0)}
                    />
                    <Button onClick={() => loadUsers(0)}>
                      <Search className="mr-2 size-4" />
                      검색
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="py-20">
                    <div className="text-center text-muted-foreground">
                      검색된 유저가 없습니다
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{user.nickname}</h3>
                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                                <Badge variant={user.active ? 'default' : 'destructive'}>
                                  {user.active ? '활성' : '정지'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.username} | {user.phoneNumber}
                              </p>
                              <p className="text-sm">
                                포인트: <span className="font-semibold">{user.pointBalance.toLocaleString()}원</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/admin/users/${user.id}`}>
                                <Button variant="outline" size="sm">
                                  상세보기
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {usersTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage === 0}
                        onClick={() => loadUsers(usersPage - 1)}
                      >
                        이전
                      </Button>
                      <span className="text-sm">
                        {usersPage + 1} / {usersTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={usersPage >= usersTotalPages - 1}
                        onClick={() => loadUsers(usersPage + 1)}
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* 프로젝트 관리 탭 */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 검색</CardTitle>
                  <CardDescription>제목으로 프로젝트를 검색합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="프로젝트 제목 입력..."
                      value={projectSearchTitle}
                      onChange={(e) => setProjectSearchTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadProjects(0)}
                    />
                    <Button onClick={() => loadProjects(0)}>
                      <Search className="mr-2 size-4" />
                      검색
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <Card>
                  <CardContent className="py-20">
                    <div className="text-center text-muted-foreground">
                      검색된 프로젝트가 없습니다
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <Card key={project.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Link href={`/project/${project.id}`}>
                                  <h3 className="font-semibold hover:underline">{project.title}</h3>
                                </Link>
                                <Badge variant={
                                  project.status === 'OPEN' ? 'default' :
                                  project.status === 'DRAFT' ? 'secondary' :
                                  project.status === 'SUCCESS' ? 'default' :
                                  'destructive'
                                }>
                                  {project.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                생성자: {project.creatorNickname} ({project.creatorUsername})
                              </p>
                              <p className="text-sm">
                                목표금액: {project.targetAmount.toLocaleString()}원 | 
                                현재금액: {project.currentAmount.toLocaleString()}원 ({project.achievementRate.toFixed(1)}%)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(project.startAt).toLocaleDateString()} ~ {new Date(project.endAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {project.status === 'DRAFT' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveProject(project.id)}
                                  >
                                    <CheckCircle className="mr-2 size-4" />
                                    승인
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRejectProject(project.id)}
                                  >
                                    <XCircle className="mr-2 size-4" />
                                    거절
                                  </Button>
                                </>
                              )}
                              {project.status === 'OPEN' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleForceStopProject(project.id)}
                                >
                                  <Ban className="mr-2 size-4" />
                                  강제정지
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {projectsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={projectsPage === 0}
                        onClick={() => loadProjects(projectsPage - 1)}
                      >
                        이전
                      </Button>
                      <span className="text-sm">
                        {projectsPage + 1} / {projectsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={projectsPage >= projectsTotalPages - 1}
                        onClick={() => loadProjects(projectsPage + 1)}
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* 경매 관리 탭 */}
            <TabsContent value="auctions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>경매 검색</CardTitle>
                  <CardDescription>제목으로 경매를 검색합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="경매 제목 입력..."
                      value={auctionSearchTitle}
                      onChange={(e) => setAuctionSearchTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadAuctions(0)}
                    />
                    <Button onClick={() => loadAuctions(0)}>
                      <Search className="mr-2 size-4" />
                      검색
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : auctions.length === 0 ? (
                <Card>
                  <CardContent className="py-20">
                    <div className="text-center text-muted-foreground">
                      검색된 경매가 없습니다
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {auctions.map((auction) => (
                      <Card key={auction.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Link href={`/auction/${auction.id}`}>
                                  <h3 className="font-semibold hover:underline">{auction.title}</h3>
                                </Link>
                                <Badge variant={
                                  auction.auctionStatus === 'RUNNING' ? 'default' :
                                  auction.auctionStatus === 'ENDED' ? 'secondary' :
                                  'destructive'
                                }>
                                  {auction.auctionStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                판매자: {auction.sellerUsername}
                              </p>
                              <p className="text-sm">
                                시작가: {auction.startPrice.toLocaleString()}원 | 
                                현재가: {auction.currentPrice.toLocaleString()}원
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(auction.startAt).toLocaleString()} ~ {new Date(auction.endAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {auction.auctionStatus === 'RUNNING' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleForceCloseAuction(auction.id)}
                                >
                                  <Ban className="mr-2 size-4" />
                                  강제종료
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {auctionsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={auctionsPage === 0}
                        onClick={() => loadAuctions(auctionsPage - 1)}
                      >
                        이전
                      </Button>
                      <span className="text-sm">
                        {auctionsPage + 1} / {auctionsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={auctionsPage >= auctionsTotalPages - 1}
                        onClick={() => loadAuctions(auctionsPage + 1)}
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
