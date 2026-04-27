/**
 * 사용자(User), 인증(Auth), 배송지(Address) 도메인 서비스
 * 로그인, 회원가입, 프로필 관리, 배송지 관리 등
 */

import {
  UserResponse,
  UserPageResponse,
  UserProfileResponse,
  LoginRequest,
  FindPasswordRequest,
  UserUpdateRequest,
  RegisterRequest,
  AuthResponse,
  OAuthProvider,
  ProfileUpdateRequest,
  AddressCreateRequest,
  AddressUpdateRequest,
  AddressResponse,
} from '@/src/types/api';
import { tokenStorage } from '@/src/lib/auth';
import { toSafeApiErrorMessage } from '@/src/lib/apiErrorMessages';
import { apiRequest, API_BASE_URL } from '@/src/services/apiClient';
import { toS3ImageUrl } from '@/src/services/utils/imageUtils';

/** DB role (ADMIN | USER) 정규화 - 백엔드 role 또는 구 role_level 지원 */
function normalizeUserRole(val: unknown): 'ADMIN' | 'USER' | undefined {
  if (val === 'ADMIN' || val === 'USER') return val;
  if (typeof val === 'number' && val >= 50) return 'ADMIN'; // 구 role_level 호환
  if (typeof val === 'number' && val < 50) return 'USER';
  return undefined;
}

// API 함수들 - 사용자 관련
export const userApi = {
  /**
   * 마이페이지 데이터 조회 (내 경매, 입찰 내역 등)
   * GET /api/users/my-page
   */
  getMyPage: async (): Promise<UserPageResponse> => {
    try {
      const backendResponse = await apiRequest<any>('/api/users/my-page', {
        method: 'GET',
      });

      return {
        user: backendResponse.user ? {
          id: backendResponse.user.id || 0,
          email: backendResponse.user.email || null,
          name: backendResponse.user.name || backendResponse.user.username || '',
          nickname: backendResponse.user.nickname || '',
          profileImageUrl: backendResponse.user.profileImageUrl || backendResponse.user.profile_image_url || null,
          phone: backendResponse.user.phone || backendResponse.user.phoneNumber || null,
          role: normalizeUserRole(backendResponse.user.role ?? backendResponse.user.role_level),
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
        auctions: (backendResponse.auctions || []).map((auction: any) => {
          const mainUrl =
            toS3ImageUrl(auction.mainImageKey) ??
            auction.thumbnailImageUrl ??
            auction.thumbnail_url ??
            (auction.images?.[0] ? toS3ImageUrl(auction.images[0].s3Key ?? auction.images[0].imageKey ?? auction.images[0].imageUrl) ?? null : null);
          return {
            id: auction.auctionId ?? auction.id ?? 0,
            title: auction.title || '',
            thumbnailImageUrl: mainUrl,
            imageUrl: mainUrl,
            startPrice: auction.startPrice || auction.start_price || 0,
            currentPrice: auction.currentPrice || auction.current_price || 0,
            bidStep: auction.bidStep || auction.bid_step || 0,
            status: auction.auctionStatus ?? auction.status ?? 'SCHEDULED',
            startAt: auction.startAt ?? auction.start_at ?? '',
            endAt: auction.endAt ?? auction.end_at ?? '',
            bidCount: auction.bidCount ?? auction.bid_count ?? 0,
            categoryPath: auction.categoryPath ?? auction.category_path ?? null,
            summary: auction.summary ?? null,
          };
        }),
        // #7: myBids(BidResponse[]) - 프로필에서 미사용. 입찰 내역은 myMyBids 사용.
        // bids 매핑 시 getAuction N회 호출 발생 → 성능 위해 빈 배열 반환
        myBids: [],
        // 백엔드 UserPageResponseDto.myBids = MyBidsSummaryDto[] (auctionSummary = AuctionSummaryDto)
        // #5: AuctionSummaryDto snake_case/camelCase 모두 지원
        myMyBids: (backendResponse.myBids || backendResponse.myMyBids || []).map((myBid: any) => {
          const summary = myBid.auctionSummary || {};
          const thumbRaw =
            summary.mainImageKey ??
            summary.main_image_key ??
            summary.thumbnailImageUrl ??
            summary.thumbnail_image_url ??
            summary.thumbnailUrl ??
            summary.thumbnail_url;
          const auctionThumbnailUrl = thumbRaw ? (toS3ImageUrl(thumbRaw) ?? thumbRaw) : null;
          const myStatus = myBid.myAuctionStatus ?? myBid.my_auction_status ?? 'OUTBID';
          return {
            auctionId: myBid.auctionId ?? myBid.auction_id ?? summary.auctionId ?? summary.auction_id ?? 0,
            auctionTitle:
              summary.title ??
              summary.auctionTitle ??
              summary.auction_title ??
              myBid.auctionTitle ??
              myBid.auction_title ??
              '',
            auctionThumbnailUrl,
            auctionStatus:
              summary.auctionStatus ??
              summary.auction_status ??
              summary.status ??
              myBid.auctionStatus ??
              myBid.auction_status ??
              'SCHEDULED',
            myAuctionStatus: myStatus,
            lastBidPrice: myBid.lastBidPrice ?? myBid.last_bid_price ?? myBid.myBidPrice ?? myBid.bidPrice ?? myBid.bid_price ?? myBid.amount ?? myBid.price ?? 0,
            currentPrice:
              summary.currentPrice ??
              summary.current_price ??
              myBid.currentPrice ??
              myBid.current_price ??
              0,
            isHighestBidder: myStatus === 'LEADING',
            lastBidAt: myBid.lastBidAt ?? myBid.last_bid_at ?? myBid.bidAt ?? myBid.bid_at ?? myBid.createdAt ?? myBid.created_at ?? '',
            auctionEndAt:
              summary.endAt ??
              summary.end_at ??
              summary.auctionEndAt ??
              summary.auction_end_at ??
              myBid.auctionEndAt ??
              myBid.auction_end_at ??
              '',
            isPaid: myBid.isPaid ?? myBid.is_paid ?? false,
          };
        }),
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 프로필 상세 조회 (다른 사용자 프로필 보기)
   * GET /api/users/{id}/profile
   */
  getUserProfile: async (id: number): Promise<UserProfileResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/users/${id}/profile`, {
        method: 'GET',
      });

      return {
        user: backendResponse.user ? {
          id: backendResponse.user.id || 0,
          email: backendResponse.user.email || null,
          name: backendResponse.user.name || backendResponse.user.username || '',
          nickname: backendResponse.user.nickname || '',
          profileImageUrl: backendResponse.user.profileImageUrl || backendResponse.user.profile_image_url || null,
          phone: backendResponse.user.phone || backendResponse.user.phoneNumber || null,
          role: normalizeUserRole(backendResponse.user.role ?? backendResponse.user.role_level),
        } : {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 사용자 정보 조회 (프로필 상세와 동일)
   * GET /api/users/{id}
   */
  getUser: async (id: number): Promise<UserResponse> => {
    try {
      const profile = await userApi.getUserProfile(id);
      return profile.user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   * TODO: authApi.getCurrentUser 사용
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    throw new Error('authApi.getCurrentUser를 사용하세요');
  },

  /**
   * 사용자 정보 수정
   * PUT /api/users/me
   */
  updateUser: async (
    data: ProfileUpdateRequest
  ): Promise<UserResponse> => {
    try {
      const requestData: any = {};
      if (data.username !== undefined) requestData.username = data.username;
      if (data.nickname !== undefined) requestData.nickname = data.nickname;
      if (data.phoneNumber !== undefined) requestData.phoneNumber = data.phoneNumber;
      if (data.profileImageUrl !== undefined) requestData.profileImageUrl = data.profileImageUrl;

      const backendResponse = await apiRequest<any>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      return {
        id: backendResponse.id || 0,
        email: backendResponse.email || null,
        name: backendResponse.name || backendResponse.username || '',
        nickname: backendResponse.nickname || '',
        profileImageUrl: backendResponse.profileImageUrl || backendResponse.profile_image_url || null,
        phone: backendResponse.phone || backendResponse.phoneNumber || null,
        role: normalizeUserRole(backendResponse.role ?? backendResponse.role_level),
        pointBalance: backendResponse.pointBalance ?? backendResponse.point_balance ?? 0,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 회원정보 수정 (비밀번호 포함)
   * PATCH /api/users/update
   */
  updateUserInfo: async (data: UserUpdateRequest): Promise<void> => {
    await apiRequest('/api/users/update', {
      method: 'PATCH',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
        nickname: data.nickname,
        phoneNumber: data.phoneNumber,
        account: data.account,
        accountHolder: data.accountHolder,
        bankType: data.bankType,
      }),
    });
  },
};

// API 함수들 - 인증 관련
export const authApi = {
  /**
   * 로그인
   * POST /api/users/login
   * 백엔드 응답:
   * - 헤더: Authorization: Bearer {accessToken}
   * - 쿠키: refresh_token={refreshToken} (HttpOnly, Secure)
   * - 본문: { "access_token": "{accessToken}" }
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // 요청 데이터 검증 및 로깅 (try-catch 밖에서 먼저 실행)
    const requestBody = {
      email: data.email,
      password: data.password,
    };
    
    const jsonBody = JSON.stringify(requestBody);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
        body: jsonBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = toSafeApiErrorMessage(
          response.status,
          errorText,
          '이메일 또는 비밀번호가 올바르지 않습니다',
        );
        throw new Error(errorMessage);
      }

      // 응답 본문에서 access_token 추출
      // 백엔드 응답 형식: { "access_token": "..." }
      const responseData = await response.json();
      const accessToken = responseData.access_token;
      
      if (!accessToken) {
        throw new Error('로그인 응답에 토큰이 없습니다');
      }

      // accessToken 저장
      tokenStorage.setAccessToken(accessToken);
      
      // refreshToken은 쿠키에 저장되므로 별도 저장 불필요
      // 백엔드가 자동으로 쿠키를 처리함

      // 로그인 응답에 사용자 정보가 포함되어 있는지 확인
      let user: UserResponse | null = null;
      
      if (responseData.user) {
        // 로그인 응답에 사용자 정보가 포함되어 있는 경우
        user = responseData.user;
      } else if (responseData.id || responseData.email) {
        // 응답 본문 자체가 사용자 정보인 경우 (UserResponseDto)
        user = {
          id: responseData.id,
          email: responseData.email,
          name: responseData.name || responseData.username || '',
          nickname: responseData.nickname || '',
          profileImageUrl: responseData.profileImageUrl || null,
          phone: responseData.phoneNumber || responseData.phone || null,
          pointBalance: responseData.pointBalance ?? responseData.point_balance ?? 0,
        };
      } else {
        // 로그인 응답에 사용자 정보가 없으면 null로 설정
        // 사용자 정보는 나중에 필요할 때 /api/users/profile로 조회
        user = null;
      }
      
      return {
        accessToken,
        refreshToken: '', // refreshToken은 쿠키에 저장되므로 빈 문자열
        user: user || {
          // 임시 사용자 정보 (사용자 정보 조회 실패 시)
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
      };
    } catch (error) {
      // 네트워크 오류 처리
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // CORS 에러인지 확인
        const errorStr = String(error);
        if (errorStr.includes('CORS') || errorStr.includes('cors')) {
          throw new Error(
            'CORS 정책 오류: 백엔드 CORS 설정을 확인해주세요.\n' +
            '필요한 설정:\n' +
            '1. setAllowCredentials(true)\n' +
            '2. setAllowedOrigins(List.of("http://localhost:3000"))\n' +
            '3. setExposedHeaders(List.of("Authorization"))'
          );
        }
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      // 에러 메시지 그대로 전달
      throw error instanceof Error ? error : new Error('로그인에 실패했습니다');
    }
  },

  /**
   * 비밀번호 찾기 (임시 비밀번호 발급 + SMS 전송)
   * POST /api/users/find-password
   */
  findPassword: async (data: FindPasswordRequest): Promise<void> => {
    await apiRequest('/api/users/find-password', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        username: data.username,
      }),
    });
  },

  /**
   * 회원가입
   * POST /api/users/register
   * 백엔드에서 UserResponseDto만 반환하므로, 회원가입 후 자동 로그인 처리
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // 회원가입 요청 데이터 준비
    const requestBody = {
      email: data.email,
      password: data.password,
      username: data.username,
      nickname: data.nickname,
      phoneNumber: data.phoneNumber,
      account: data.account || null,
      accountHolder: data.accountHolder || null,
      bankType: data.bankType || null,
    };
    const jsonBody = JSON.stringify(requestBody);

    try {
      // 회원가입 요청
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
        body: jsonBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          toSafeApiErrorMessage(response.status, errorText, '회원가입에 실패했습니다'),
        );
      }

      // 백엔드에서 UserResponseDto 반환 (토큰 없음)
      const userData = await response.json();
      
      // 백엔드가 토큰을 함께 반환하는 경우
      if (userData.accessToken) {
        return {
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          user: userData.user || userData,
        };
      }
      
      // 백엔드가 UserResponseDto만 반환하는 경우, 자동 로그인 처리
      const loginResponse = await authApi.login({
        email: data.email,
        password: data.password,
      });
      return loginResponse;
    } catch (error) {
      // 네트워크 오류인 경우 더 명확한 메시지 제공
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const errorStr = String(error);
        if (errorStr.includes('CORS') || errorStr.includes('cors')) {
          throw new Error(
            'CORS 정책 오류: 백엔드 CORS 설정을 확인해주세요.\n' +
            '필요한 설정:\n' +
            '1. setAllowCredentials(true)\n' +
            '2. setAllowedOrigins(List.of("http://localhost:3000"))\n' +
            '3. /api/users/register 경로를 permitAll()로 설정'
          );
        }
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error instanceof Error ? error : new Error('회원가입에 실패했습니다');
    }
  },

  /**
   * 로그아웃
   * POST /api/users/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest<void>('/api/users/logout', {
        method: 'POST',
      });
    } catch {
      // API 호출 실패해도 클라이언트에서 토큰 삭제는 진행
      // (네트워크 오류 등으로 백엔드 호출이 실패해도 로그아웃은 처리)
    }
  },

  /**
   * 토큰 갱신
   * POST /api/users/refresh-token
   * 
   * 백엔드 동작:
   * - 쿠키에서 refresh_token 읽음 (credentials: 'include' 필수)
   * - 새로운 access_token 발급
   * - 응답 본문: { "access_token": "..." }
   * 
   * @param refreshToken - 사용하지 않음 (쿠키에서 자동으로 읽음)
   * @returns 새로운 액세스 토큰과 사용자 정보
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // refreshToken 쿠키 전송을 위해 필수
      });

      if (!response.ok) {
        // 401: 리프레시 토큰이 만료되었거나 유효하지 않음
        if (response.status === 401) {
          // 토큰 삭제 후 재로그인 필요
          tokenStorage.clearAll();
          throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
        }
        
        const errorText = await response.text();
        throw new Error(
          toSafeApiErrorMessage(response.status, errorText, '토큰 갱신에 실패했습니다'),
        );
      }

      // 응답에서 새로운 액세스 토큰 추출 (백엔드: newAccessToken 또는 access_token/accessToken)
      const responseData = await response.json();
      const newAccessToken =
        responseData.newAccessToken ||
        responseData.access_token ||
        responseData.accessToken;
      
      if (!newAccessToken) {
        throw new Error('토큰 갱신 응답에 액세스 토큰이 없습니다');
      }

      // 새로운 액세스 토큰 저장
      tokenStorage.setAccessToken(newAccessToken);

      let user: UserResponse | null = null;
      if (responseData.user) {
        user = responseData.user;
      } else {
        try {
          user = await authApi.getCurrentUser();
        } catch {
          user = {
            id: 0,
            email: null,
            name: '',
            nickname: '',
            profileImageUrl: null,
            phone: null,
          };
        }
      }

      return {
        accessToken: newAccessToken,
        refreshToken: '', // refreshToken은 쿠키에 저장되므로 빈 문자열
        user: user || {
          id: 0,
          email: null,
          name: '',
          nickname: '',
          profileImageUrl: null,
          phone: null,
        },
      };
    } catch (error) {
      // 네트워크 오류 처리
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error instanceof Error ? error : new Error('토큰 갱신에 실패했습니다');
    }
  },

  /**
   * 현재 사용자 정보 조회 (토큰으로)
   * GET /api/users/profile
   * 
   * 주의: 백엔드에 해당 엔드포인트가 없을 수 있음
   * 이 경우 에러를 던지고, 호출하는 쪽에서 처리해야 함
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      // 백엔드 응답을 받아서 구조 확인
      const backendResponse = await apiRequest<any>('/api/users/profile', {
        method: 'GET',
      });
      
      // 백엔드 응답 검증
      if (!backendResponse) {
        throw new Error('백엔드 응답이 비어있습니다');
      }
      
      // 백엔드 응답을 프론트엔드 타입으로 변환
      // 백엔드 필드명이 다를 수 있으므로 안전하게 변환
      const user: UserResponse = {
        id: backendResponse.id ?? backendResponse.userId ?? 0,
        email: backendResponse.email ?? null,
        name: backendResponse.name ?? backendResponse.username ?? '',
        nickname: backendResponse.nickname ?? '',
        profileImageUrl: backendResponse.profileImageUrl ?? backendResponse.profile_image_url ?? null,
        phone: backendResponse.phone ?? backendResponse.phoneNumber ?? backendResponse.phone_number ?? null,
        role: normalizeUserRole(backendResponse.role ?? backendResponse.role_level),
        pointBalance: backendResponse.pointBalance ?? backendResponse.point_balance ?? 0,
      };
      
      return user;
    } catch (error) {
      // 401 Unauthorized인 경우 토큰이 만료되었거나 유효하지 않음
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        // 토큰 삭제
        tokenStorage.clearAll();
        throw new Error('로그인이 필요합니다');
      }
      
      // 404 Not Found인 경우 엔드포인트가 없을 수 있음
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        throw new Error('사용자 정보 조회 API가 없습니다');
      }
      
      // 500 Internal Server Error인 경우 백엔드 에러
      if (error instanceof Error && (error.message.includes('500') || error.message.includes('Internal Server Error'))) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      // 다른 에러는 그대로 던짐
      throw error;
    }
  },

  /**
   * OAuth 로그인 시작 (백엔드로 리다이렉트)
   * @param provider OAuth 제공자 (google, kakao, naver)
   * @returns OAuth 로그인 페이지 URL
   */
  oauthLogin: async (provider: OAuthProvider): Promise<string> => {
    // 백엔드 API 엔드포인트
    // 백엔드에서 OAuth 로그인 엔드포인트를 제공한다고 가정
    // 예: GET /oauth2/{provider} -> OAuth 제공자 페이지로 리다이렉트
    const redirectUrl = `${API_BASE_URL}/oauth2/authorization/${provider}`;
    
    // 실제 백엔드 연동 시:
    // 1. 백엔드가 OAuth 제공자 로그인 페이지로 리다이렉트
    // 2. 사용자 인증 후 백엔드 콜백 URL로 돌아옴
    // 3. 백엔드에서 토큰 발급 후 프론트엔드 콜백 URL로 리다이렉트
    //    예: /auth/oauth/callback?provider={provider}&code={code}&state={state}
    
    return redirectUrl;
  },

  /**
   * OAuth 콜백 처리 (백엔드에서 코드를 받아 토큰으로 교환)
   * @param provider OAuth 제공자
   * @param code OAuth 인증 코드
   * @param state OAuth state (CSRF 방지용)
   * @returns 인증 정보 (accessToken, refreshToken, user)
   */
  oauthCallback: async (
    provider: OAuthProvider,
    code: string,
    state?: string
  ): Promise<AuthResponse> => {
    try {
      // 백엔드 OAuth 콜백 엔드포인트 호출
      // POST /oauth2/callback/{provider}
      // Body: { code: string, state?: string }
      const response = await fetch(`${API_BASE_URL}/oauth2/callback/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          toSafeApiErrorMessage(response.status, errorText, 'OAuth 인증에 실패했습니다'),
        );
      }

      const data = await response.json();
      
      // 백엔드 응답 형식에 맞게 변환
      // 백엔드에서 AuthResponse 형식으로 반환한다고 가정
      // 예: { accessToken: string, refreshToken?: string, user: UserResponse }
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('OAuth 인증에 실패했습니다');
    }
  },

  /**
   * 프로필 업데이트
   * PATCH /api/users/update-profile
   * 백엔드 응답: {"newAccessToken": "..."}
   */
  updateProfile: async (data: ProfileUpdateRequest): Promise<UserResponse> => {
    try {
      // 백엔드 DTO에 맞게 필드명 변환
      const requestData: any = {
        username: data.username || data.name,  // username 우선, 없으면 name 사용
        nickname: data.nickname,
        phoneNumber: data.phoneNumber || data.phone,  // phoneNumber 우선, 없으면 phone 사용
        profileImageUrl: data.profileImageUrl,
      };
      
      const backendResponse = await apiRequest<any>('/api/users/update-profile', {
        method: 'PATCH',
        body: JSON.stringify(requestData),
      });

      // 백엔드 응답에서 newAccessToken 추출 및 저장
      if (backendResponse.newAccessToken) {
        tokenStorage.setAccessToken(backendResponse.newAccessToken);
      }

      // 사용자 정보는 별도로 조회 (백엔드가 newAccessToken만 반환하는 경우)
      // 또는 응답에 사용자 정보가 포함되어 있다면 사용
      let user: UserResponse;
      
      if (backendResponse.id || backendResponse.email) {
        // 응답에 사용자 정보가 포함된 경우
        user = {
          id: backendResponse.id ?? backendResponse.userId ?? 0,
          email: backendResponse.email ?? null,
          name: backendResponse.name ?? backendResponse.username ?? '',
          nickname: backendResponse.nickname ?? '',
          profileImageUrl: backendResponse.profileImageUrl ?? backendResponse.profile_image_url ?? null,
          phone: backendResponse.phone ?? backendResponse.phoneNumber ?? backendResponse.phone_number ?? null,
          role: normalizeUserRole(backendResponse.role ?? backendResponse.role_level),
          pointBalance: backendResponse.pointBalance ?? backendResponse.point_balance ?? 0,
        };
      } else {
        // 응답에 사용자 정보가 없는 경우, 새 토큰으로 사용자 정보 조회
        user = await authApi.getCurrentUser();
      }

      return user;
    } catch (error) {
      throw error;
    }
  },
};

/** 백엔드 AddressResponseDto → 프론트엔드 AddressResponse 변환 */
function mapAddressResponse(raw: any, fallbackId = 0): AddressResponse {
  return {
    id: raw.id ?? fallbackId,
    label: raw.label ?? null,
    recipientName: raw.recipientName ?? raw.recipient_name ?? '',
    phone: raw.phone ?? '',
    zipCode: raw.zipCode ?? raw.zip_code ?? '',
    address: raw.address1 ?? raw.address ?? '',
    detailAddress: raw.address2 ?? raw.detailAddress ?? raw.detail_address ?? '',
    isDefault: raw.isDefault ?? raw.is_default ?? raw.default ?? false,
  };
}

// API 함수들 - 배송지 관련 (백엔드 AddressController 기준)
// 크라우드펀딩 리워드 구매 후 배송지 선택에 사용
export const addressApi = {
  /**
   * 기본 배송지 단건 조회
   * GET /api/addresses/default
   * - 기본 배송지 있으면 200 + AddressResponseDto
   * - 없으면 204 No Content → null 반환
   */
  getDefaultAddress: async (): Promise<AddressResponse | null> => {
    const token = tokenStorage.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/addresses/default`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.trim().replace(/^["']|["']$/g, '')}` } : {}),
      },
      credentials: 'include',
    });

    if (response.status === 204) {
      return null;
    }
    if (!response.ok) {
      const errText = await response.text();
      let msg = `배송지 조회 실패 (${response.status})`;
      try {
        const j = JSON.parse(errText);
        if (j.message ?? j.error) msg = j.message ?? j.error;
      } catch {}
      throw new Error(msg);
    }
    const backendResponse = await response.json();
    return mapAddressResponse(backendResponse);
  },

  /**
   * 내 배송지 목록 조회
   * GET /api/addresses
   */
  getMyAddresses: async (): Promise<AddressResponse[]> => {
    const backendResponse = await apiRequest<any[]>('/api/addresses', { method: 'GET' });
    return backendResponse.map((addr: any) => mapAddressResponse(addr));
  },

  /**
   * 배송지 생성
   * POST /api/addresses
   * - 201 Created + body: 생성된 배송지 ID (Long)
   * - setAsDefault=true면 생성과 동시에 기본 배송지로 설정
   */
  createAddress: async (data: AddressCreateRequest): Promise<number> => {
    const requestData: Record<string, unknown> = {
      recipientName: data.recipientName,
      phone: data.phone,
      zipCode: data.zipCode,
      address1: data.address,
      address2: data.detailAddress,
    };
    if (data.label != null && data.label !== '') requestData.label = data.label;
    if (data.setAsDefault !== undefined) requestData.setAsDefault = data.setAsDefault;

    const result = await apiRequest<number>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return typeof result === 'number' ? result : (result as any)?.id ?? 0;
  },

  /**
   * 배송지 상세 조회
   * GET /api/addresses/{addressId}
   */
  getAddress: async (addressId: number): Promise<AddressResponse> => {
    const backendResponse = await apiRequest<any>(`/api/addresses/${addressId}`, { method: 'GET' });
    return mapAddressResponse(backendResponse, addressId);
  },

  /**
   * 배송지 수정
   * PATCH /api/addresses/{addressId}
   * - 204 No Content
   */
  updateAddress: async (addressId: number, data: AddressUpdateRequest): Promise<void> => {
    const requestData: Record<string, unknown> = {};
    if (data.label !== undefined) requestData.label = data.label;
    if (data.recipientName !== undefined) requestData.recipientName = data.recipientName;
    if (data.phone !== undefined) requestData.phone = data.phone;
    if (data.zipCode !== undefined) requestData.zipCode = data.zipCode;
    if (data.address !== undefined) requestData.address1 = data.address;
    if (data.detailAddress !== undefined) requestData.address2 = data.detailAddress;

    await apiRequest(`/api/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
    });
  },

  /**
   * 배송지 삭제
   * DELETE /api/addresses/{addressId}
   * - 204 No Content
   */
  deleteAddress: async (addressId: number): Promise<void> => {
    await apiRequest(`/api/addresses/${addressId}`, { method: 'DELETE' });
  },

  /**
   * 기본 배송지 설정
   * PUT /api/addresses/{addressId}/default
   * - 204 No Content
   * - 기존 기본 배송지 해제 후 지정한 addressId가 기본이 됨
   */
  setDefaultAddress: async (addressId: number): Promise<void> => {
    await apiRequest(`/api/addresses/${addressId}/default`, { method: 'PUT' });
  },
};
