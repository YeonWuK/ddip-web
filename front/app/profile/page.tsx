"use client"

import { Navigation } from "@/src/components/navigation"
import { EmptyState } from "@/src/components/empty-state"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { useForm } from "react-hook-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Separator } from "@/src/components/ui/separator"
import { Loader2, Calendar, Gavel, Heart, Package, MapPin, Plus, Trash2, ChevronRight, Edit, X } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { projectApi, auctionApi, userApi, addressApi } from "@/src/services/api"
import { ProjectResponse, AuctionSummary, SupportResponse, MyBidsSummary, UserPageResponse, AddressResponse, AddressCreateRequest, AddressUpdateRequest } from "@/src/types/api"
import { getWishlist } from "@/src/lib/wishlist"
import { formatBidDateTime } from "@/src/lib/date-utils"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

function ProfileDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // 데이터 상태
  const [myProjects, setMyProjects] = useState<ProjectResponse[]>([])
  const [myAuctions, setMyAuctions] = useState<AuctionSummary[]>([])
  const [mySupports, setMySupports] = useState<SupportResponse[]>([])
  const [myBids, setMyBids] = useState<MyBidsSummary[]>([])
  const [favoriteProjects, setFavoriteProjects] = useState<ProjectResponse[]>([])
  const [favoriteAuctions, setFavoriteAuctions] = useState<AuctionSummary[]>([])
  
  // 배송지 관련 상태
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [defaultAddress, setDefaultAddress] = useState<AddressResponse | null>(null)
  const [addressManagerOpen, setAddressManagerOpen] = useState(false)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadInitialData()
    }
  }, [authLoading, isAuthenticated])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [myPageData, allProjects, allAuctions, addrList, defAddr] = await Promise.all([
        userApi.getMyPage(),
        projectApi.getProjects(),
        auctionApi.getAuctions(),
        addressApi.getMyAddresses(),
        addressApi.getDefaultAddress().catch(() => null)
      ])

      const userId = user?.id || myPageData.user.id
      setMyProjects(allProjects.filter(p => p.creator.id === userId))
      setMyAuctions(myPageData.auctions)
      setMyBids(myPageData.myMyBids)
      
      const supports = await projectApi.getMySupports(userId)
      setMySupports(supports)

      const wishlist = getWishlist()
      const favProjIds = wishlist.filter(i => i.type === "project").map(i => i.id)
      const favAucIds = wishlist.filter(i => i.type === "auction").map(i => i.id)
      setFavoriteProjects(allProjects.filter(p => favProjIds.includes(p.id)))
      setFavoriteAuctions(allAuctions.filter(a => favAucIds.includes(a.id)))

      setAddresses(addrList)
      setDefaultAddress(defAddr)
    } catch (error) {
      toast.error("데이터를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // --- 배송지 CRUD 핸들러 ---
  const refreshAddresses = async () => {
    try {
      const [list, def] = await Promise.all([
        addressApi.getMyAddresses(),
        addressApi.getDefaultAddress().catch(() => null)
      ])
      setAddresses(list)
      setDefaultAddress(def)
    } catch (error) { console.error(error) }
  }

  const handleCreateAddress = async (data: AddressCreateRequest) => {
    try {
      await addressApi.createAddress(data)
      toast.success("배송지가 추가되었습니다")
      setAddressFormOpen(false)
      await refreshAddresses()
    } catch (error) { toast.error("배송지 추가에 실패했습니다") }
  }

  const handleUpdateAddress = async (id: number, data: AddressUpdateRequest) => {
    try {
      await addressApi.updateAddress(id, data)
      toast.success("배송지가 수정되었습니다")
      setAddressFormOpen(false)
      setEditingAddress(null)
      await refreshAddresses()
    } catch (error) { toast.error("배송지 수정에 실패했습니다") }
  }

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("정말로 이 배송지를 삭제하시겠습니까?")) return
    try {
      await addressApi.deleteAddress(id)
      toast.success("배송지가 삭제되었습니다")
      await refreshAddresses()
    } catch (error) { toast.error("배송지 삭제에 실패했습니다") }
  }

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id)
      toast.success("기본 배송지로 설정되었습니다")
      await refreshAddresses()
    } catch (error) { toast.error("설정에 실패했습니다") }
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary size-10" /></div>

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* 상단 프로필 및 배송지 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="md:col-span-2 flex items-center p-6 bg-white border-none shadow-sm">
            <Avatar className="size-20 mr-6 border-2 border-white shadow-md">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-xl">{user?.nickname?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user?.nickname}님, 환영합니다!</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="font-normal">정보통신공학</Badge>
                <Badge variant="outline" className="font-normal">4학년</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-none shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-2"><MapPin className="size-4" /> 기본 배송지</div>
              <span className="text-[10px] text-muted-foreground">{addresses.length}개 보유</span>
            </div>
            {defaultAddress ? (
              <div className="text-sm">
                <p className="font-bold truncate">{defaultAddress.recipientName}</p>
                <p className="text-muted-foreground truncate text-xs">{defaultAddress.address}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">등록된 배송지가 없습니다.</p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setAddressManagerOpen(true)}>
              배송지 관리
            </Button>
          </Card>
        </div>

        {/* 5개 섹션 대시보드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="space-y-4">
            <SectionTitle title="내 프로젝트" count={myProjects.length} href="/profile/projects" />
            <div className="space-y-3">
              {myProjects.slice(0, 3).map(p => <SmallProjectCard key={p.id} project={p} />)}
              {myProjects.length === 0 && <EmptyBox message="등록된 프로젝트가 없습니다." />}
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="내 경매 현황" count={myAuctions.length} href="/profile/auctions" />
            <div className="space-y-3">
              {myAuctions.slice(0, 3).map(a => <SmallAuctionCard key={a.id} auction={a} />)}
              {myAuctions.length === 0 && <EmptyBox message="진행 중인 경매가 없습니다." />}
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="입찰 내역" count={myBids.length} />
            <Card className="divide-y border-none shadow-sm">
              {myBids.slice(0, 5).map(b => <BidItem key={b.auctionId} bid={b} />)}
              {myBids.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">내역 없음</div>}
            </Card>
          </section>

          <div className="space-y-8">
            <section className="space-y-4">
              <SectionTitle title="후원 내역" count={mySupports.length} />
              <Card className="divide-y border-none shadow-sm">
                {mySupports.slice(0, 3).map(s => <SupportItem key={s.id} support={s} />)}
                {mySupports.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">내역 없음</div>}
              </Card>
            </section>

            <section className="space-y-4">
              <SectionTitle title="찜한 항목" count={favoriteProjects.length + favoriteAuctions.length} />
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {favoriteProjects.slice(0, 4).map(p => <FavCircle key={p.id} item={p} type="project" />)}
                {favoriteAuctions.slice(0, 4).map(a => <FavCircle key={a.id} item={a} type="auction" />)}
              </div>
            </section>
          </div>
        </div>

        {/* 배송지 관리 모달 (CRUD 흐름 유지) */}
        <Dialog open={addressManagerOpen} onOpenChange={setAddressManagerOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <DialogTitle>배송지 관리</DialogTitle>
              <Button size="sm" onClick={() => { setEditingAddress(null); setAddressFormOpen(true); }}>
                <Plus className="size-4 mr-1" /> 추가
              </Button>
            </DialogHeader>
            <div className="overflow-y-auto py-4 space-y-3">
              {addresses.map(addr => (
                <Card key={addr.id} className="p-4 relative hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{addr.recipientName}</span>
                      {addr.isDefault && <Badge className="text-[10px] h-4">기본</Badge>}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setEditingAddress(addr); setAddressFormOpen(true); }} className="text-slate-400 hover:text-slate-600"><Edit className="size-4" /></button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mb-1">{addr.phone}</p>
                  <p className="text-slate-600 text-xs leading-snug">[{addr.zipCode}] {addr.address} {addr.detailAddress}</p>
                  {!addr.isDefault && (
                    <Button variant="link" className="p-0 h-auto text-[11px] mt-2 text-primary" onClick={() => handleSetDefaultAddress(addr.id)}>
                      기본 배송지로 설정
                    </Button>
                  )}
                </Card>
              ))}
              {addresses.length === 0 && <p className="text-center py-10 text-slate-400 text-sm">등록된 배송지가 없습니다.</p>}
            </div>
          </DialogContent>
        </Dialog>

        {/* 배송지 추가/수정 폼 모달 */}
        <Dialog open={addressFormOpen} onOpenChange={setAddressFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "배송지 수정" : "배송지 추가"}</DialogTitle>
            </DialogHeader>
            <AddressForm 
              address={editingAddress}
              onSubmit={editingAddress ? (data) => handleUpdateAddress(editingAddress.id, data as AddressUpdateRequest) : (data) => handleCreateAddress(data as AddressCreateRequest)}
              onCancel={() => setAddressFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

      </main>
    </div>
  )
}

// --- 공통 서브 컴포넌트 ---

function SectionTitle({ title, count, href }: { title: string, count: number, href?: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="font-bold text-lg flex items-center gap-2">
        {title} <span className="text-primary/60 text-sm font-medium">{count}</span>
      </h2>
      {href && (
        <Link href={href} className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors">
          전체보기 <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  )
}

function SmallProjectCard({ project }: { project: ProjectResponse }) {
  const percent = Math.round((project.currentAmount / project.targetAmount) * 100);
  return (
    <Link href={`/project/${project.id}`}>
      <Card className="p-3 bg-white hover:shadow-md transition-all border-none">
        <div className="flex gap-4 items-center">
          <div className="relative size-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
            <Image src={project.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate mb-1">{project.title}</h4>
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-xs">{percent}%</span>
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function SmallAuctionCard({ auction }: { auction: AuctionSummary }) {
  return (
    <Link href={`/auction/${auction.id}`}>
      <Card className="p-3 bg-white hover:shadow-md transition-all border-none">
        <div className="flex gap-4 items-center">
          <div className="relative size-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
            <Image src={auction.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate mb-1">{auction.title}</h4>
            <div className="flex justify-between items-end">
              <p className="text-[10px] text-muted-foreground uppercase">현재가</p>
              <p className="text-sm font-bold text-secondary">{auction.currentPrice.toLocaleString()}원</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function BidItem({ bid }: { bid: MyBidsSummary }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="min-w-0 flex-1 mr-4">
        <p className="text-sm font-medium truncate">{bid.auctionTitle}</p>
        <p className="text-[10px] text-muted-foreground">{formatBidDateTime(bid.lastBidAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold">{bid.lastBidPrice.toLocaleString()}원</p>
        {bid.isHighestBidder && <Badge className="text-[9px] h-4 px-1 bg-blue-500">최고가</Badge>}
      </div>
    </div>
  )
}

function SupportItem({ support }: { support: SupportResponse }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="min-w-0 flex-1 mr-4">
        <p className="text-sm font-medium truncate">{support.projectTitle}</p>
        <p className="text-[10px] text-muted-foreground truncate">{support.rewardTierTitle}</p>
      </div>
      <p className="text-sm font-bold text-primary">{support.amount.toLocaleString()}원</p>
    </div>
  )
}

function FavCircle({ item, type }: { item: any, type: string }) {
  return (
    <Link href={`/${type}/${item.id}`} className="shrink-0 group text-center">
      <div className="relative size-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all mb-1 bg-slate-200">
        <Image src={item.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
      </div>
      <p className="text-[10px] font-medium w-16 truncate text-slate-600">{item.title}</p>
    </Link>
  )
}

function EmptyBox({ message }: { message: string }) {
  return <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground text-xs bg-white/40">{message}</div>
}

// --- 배송지 입력 폼 (지웅님 원본 코드 유지) ---
function AddressForm({
  address,
  onSubmit,
  onCancel,
}: {
  address: AddressResponse | null
  onSubmit: (data: AddressCreateRequest | AddressUpdateRequest) => void
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressCreateRequest>({
    defaultValues: address ? {
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.address,
      detailAddress: address.detailAddress,
      setAsDefault: address.isDefault,
    } : {
      recipientName: "", phone: "", zipCode: "", address: "", detailAddress: "", setAsDefault: false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="recipientName">수령인 이름 *</Label>
        <Input id="recipientName" {...register("recipientName", { required: "수령인 이름을 입력해주세요" })} placeholder="홍길동" />
        {errors.recipientName && <p className="text-xs text-red-500">{errors.recipientName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">전화번호 *</Label>
        <Input id="phone" {...register("phone", { required: "전화번호를 입력해주세요" })} placeholder="010-1234-5678" />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">우편번호 *</Label>
          <Input id="zipCode" {...register("zipCode", { required: "우편번호 필수" })} placeholder="12345" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">주소 *</Label>
          <Input id="address" {...register("address", { required: "주소 필수" })} placeholder="서울시..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="detailAddress">상세주소 *</Label>
        <Input id="detailAddress" {...register("detailAddress", { required: "상세주소 필수" })} placeholder="101동..." />
      </div>
      {!address && (
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="setAsDefault" {...register("setAsDefault")} className="rounded border-gray-300" />
          <Label htmlFor="setAsDefault" className="text-sm cursor-pointer">기본 배송지로 설정</Label>
        </div>
      )}
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">{address ? "수정하기" : "추가하기"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary size-10" /></div>}>
        <ProfileDashboard />
      </Suspense>
    </ProtectedRoute>
  )
}