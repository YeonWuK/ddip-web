/**
 * 크라우드펀딩(Crowd) 도메인 서비스
 * 프로젝트 생성, 조회, 수정, 삭제 및 후원(Pledge) 관리
 */

import {
  ProjectResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  SupportRequest,
  SupportResponse,
  PledgeCreateRequest,
  PledgeResponse,
  UserResponse,
} from '@/src/types/api';
import { apiRequest } from '@/src/services/apiClient';
import { toS3ImageUrl } from '@/src/services/utils/imageUtils';

// API 함수들 - 프로젝트 관련
export const projectApi = {
  /**
   * 프로젝트 목록 조회
   * GET /api/crowd
   */
  getProjects: async (params?: {
    status?: ProjectResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    try {
      // 백엔드에서 전체 프로젝트 목록 조회
      const backendResponse = await apiRequest<any[]>('/api/crowd', {
        method: 'GET',
      });

      // 각 프로젝트를 프론트엔드 타입으로 변환
      const projects = backendResponse.map((backendProject: any) => {
        // Creator 정보 처리
        let creator: UserResponse;
        if (backendProject.creator) {
          creator = {
            id: backendProject.creator.id || backendProject.creatorId || 0,
            email: backendProject.creator.email || null,
            name: backendProject.creator.name || backendProject.creator.username || '',
            nickname: backendProject.creator.nickname || '',
            profileImageUrl: backendProject.creator.profileImageUrl || null,
            phone: backendProject.creator.phone || backendProject.creator.phoneNumber || null,
          };
        } else if (backendProject.creatorId) {
          creator = {
            id: backendProject.creatorId,
            email: null,
            name: '',
            nickname: `사용자 ${backendProject.creatorId}`,
            profileImageUrl: null,
            phone: null,
          };
        } else {
          creator = {
            id: 0,
            email: null,
            name: '',
            nickname: '알 수 없음',
            profileImageUrl: null,
            phone: null,
          };
        }

        // 이미지 처리 - 경매와 동일: images[] → S3 풀 URL로 변환
        const projectImages = backendProject.images ?? [];
        const imageUrlsFromS3 = projectImages
          .map((img: any) => {
            const keyOrUrl =
              typeof img === 'string'
                ? img
                : img?.s3Key ??
                  img?.s3_key ??
                  img?.imageKey ??
                  img?.image_key ??
                  img?.key ??
                  img?.imageUrl ??
                  img?.image_url ??
                  img?.url ??
                  img?.filePath ??
                  img?.file_path ??
                  (typeof img?.image === 'string' ? img.image : img?.image?.url ?? img?.image?.imageKey ?? img?.image?.s3Key);
            return toS3ImageUrl(keyOrUrl);
          })
          .filter((url: string | null): url is string => url != null);
        const thumb = backendProject.thumbnailUrl || backendProject.thumbnail_url || null;
        const firstImageUrl =
          imageUrlsFromS3[0] ??
          toS3ImageUrl(backendProject.imageUrl ?? thumb);
        const imageUrl = firstImageUrl ?? toS3ImageUrl(thumb);
        const imageUrls = imageUrlsFromS3.length > 0 ? imageUrlsFromS3 : (imageUrl ? [imageUrl] : null);

        // 날짜 필드 처리
        const startAt = backendProject.startAt || backendProject.start_at || '';
        const endAt = backendProject.endAt || backendProject.end_at || '';
        const createdAt = backendProject.createdAt || backendProject.created_date || backendProject.createdDate || '';

        return {
          id: backendProject.id,
          creator,
          title: backendProject.title || '',
          description: backendProject.description || '',
          imageUrl,
          imageUrls,
          targetAmount: backendProject.targetAmount || backendProject.target_amount || 0,
          currentAmount: backendProject.currentAmount || backendProject.current_amount || 0,
          status: backendProject.status || 'DRAFT',
          startAt,
          endAt,
        rewardTiers: (backendProject.rewardTiers || backendProject.reward_tiers || []).map((tier: any) => ({
          id: tier.rewardTierId ?? tier.id ?? 0,
          rewardTierId: tier.rewardTierId ?? tier.id,
          title: tier.title || '',
          description: tier.description || '',
          price: tier.price || 0,
          limitQuantity: tier.limitQuantity !== undefined ? tier.limitQuantity : (tier.limit_quantity !== undefined ? tier.limit_quantity : null),
          soldQuantity: tier.soldQuantity ?? tier.sold_quantity ?? 0,
          soldOut: tier.soldOut ?? false,
        })),
          backerCount: backendProject.backerCount ?? backendProject.backer_count,
          createdAt,
          categoryPath: backendProject.categoryPath || backendProject.category_path || null,
          tags: backendProject.tags || null,
          summary: backendProject.summary || null,
        } as ProjectResponse;
      });

      // 클라이언트 사이드 필터링 (백엔드에 필터링 파라미터가 없으므로)
      let filteredProjects = projects;
      
      // 상태 필터링
      if (params?.status) {
        filteredProjects = filteredProjects.filter(project => project.status === params.status);
      }

      // 최신순 정렬 (createdAt 기준)
      filteredProjects.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // 최신순
      });

      // 페이지네이션 적용
      if (params?.page && params?.limit) {
        const page = params.page;
        const limit = params.limit;
        const offset = (page - 1) * limit;
        return filteredProjects.slice(offset, offset + limit);
      }

      // limit만 있는 경우
      if (params?.limit) {
        return filteredProjects.slice(0, params.limit);
      }

      return filteredProjects;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 프로젝트 상세 조회
   * GET /api/crowd/{projectId}
   * 백엔드 응답: ProjectDetailResponseDto
   */
  getProject: async (id: number): Promise<ProjectResponse> => {
    try {
      const backendResponse = await apiRequest<any>(`/api/crowd/${id}`, {
        method: 'GET',
      });

      // ProjectDetailResponseDto 변환: creator(CreatorDto), images(ProjectImageResponseDto[]), rewardTiers(RewardTierResponseDto[])
      // startAt/endAt: LocalDate ("2025-02-12") 또는 LocalDateTime
      let creator: UserResponse;
      if (backendResponse.creator) {
        const c = backendResponse.creator;
        creator = {
          id: c.id ?? c.userId ?? 0,
          email: c.email ?? null,
          name: c.name ?? c.username ?? '',
          nickname: c.nickname ?? '',
          profileImageUrl: c.profileImageUrl ?? c.profile_image_url ?? null,
          phone: c.phone ?? c.phoneNumber ?? c.phone_number ?? null,
        };
      } else if (backendResponse.creatorId) {
        creator = {
          id: backendResponse.creatorId,
          email: null,
          name: '',
          nickname: `사용자 ${backendResponse.creatorId}`,
          profileImageUrl: null,
          phone: null,
        };
      } else {
        creator = {
          id: 0,
          email: null,
          name: '',
          nickname: '알 수 없음',
          profileImageUrl: null,
          phone: null,
        };
      }

      // 이미지: ProjectDetailResponseDto.images (ProjectImageResponseDto: id, key)
      const images = backendResponse.images ?? [];
      const imageItems: { id: number; url: string }[] = [];
      const imageUrlsFromS3 = images
        .map((img: any) => {
          const keyOrUrl =
            typeof img === 'string'
              ? img
              : img?.key ??
                img?.s3Key ??
                img?.s3_key ??
                img?.imageKey ??
                img?.image_key ??
                img?.imageUrl ??
                img?.image_url ??
                img?.url ??
                img?.filePath ??
                img?.file_path ??
                (typeof img?.image === 'string' ? img.image : img?.image?.url ?? img?.image?.imageKey ?? img?.image?.s3Key);
          const url = toS3ImageUrl(keyOrUrl);
          if (url && typeof img === 'object' && img != null && (img.id ?? img.imageId) != null) {
            imageItems.push({ id: img.id ?? img.imageId, url });
          }
          return url;
        })
        .filter((url: string | null): url is string => url != null);
      const thumbnailUrl = backendResponse.thumbnailUrl ?? backendResponse.thumbnail_url ?? null;
      const firstImageUrl =
        imageUrlsFromS3[0] ??
        toS3ImageUrl(backendResponse.imageUrl ?? thumbnailUrl) ??
        toS3ImageUrl(thumbnailUrl);
      const imageUrls = imageUrlsFromS3.length > 0 ? imageUrlsFromS3 : (firstImageUrl ? [firstImageUrl] : null);
      const imageUrl = firstImageUrl;

      // 날짜: LocalDate "2025-02-12" 또는 LocalDateTime ISO
      const startAt = backendResponse.startAt ?? backendResponse.start_at ?? '';
      const endAt = backendResponse.endAt ?? backendResponse.end_at ?? '';
      const createdAt = backendResponse.createdAt ?? backendResponse.created_date ?? backendResponse.createdDate ?? '';

      const project: ProjectResponse = {
        id: backendResponse.id,
        creator,
        title: backendResponse.title ?? '',
        description: backendResponse.description ?? '',
        imageUrl,
        imageUrls,
        targetAmount: backendResponse.targetAmount ?? backendResponse.target_amount ?? 0,
        currentAmount: backendResponse.currentAmount ?? backendResponse.current_amount ?? 0,
        status: backendResponse.status ?? 'DRAFT',
        startAt,
        endAt,
        rewardTiers: (backendResponse.rewardTiers ?? backendResponse.reward_tiers ?? []).map((tier: any) => ({
          id: tier.rewardTierId ?? tier.id ?? 0,
          rewardTierId: tier.rewardTierId ?? tier.id,
          title: tier.title ?? '',
          description: tier.description ?? '',
          price: tier.price ?? 0,
          limitQuantity: tier.limitQuantity !== undefined ? tier.limitQuantity : (tier.limit_quantity !== undefined ? tier.limit_quantity : null),
          soldQuantity: tier.soldQuantity ?? tier.sold_quantity ?? 0,
          soldOut: tier.soldOut ?? false,
        })),
        backerCount: backendResponse.backerCount ?? backendResponse.backer_count,
        achievementRate: backendResponse.achievementRate,
        createdAt,
        categoryPath: backendResponse.categoryPath ?? backendResponse.category_path ?? null,
        tags: backendResponse.tags ?? null,
        summary: backendResponse.summary ?? null,
        imageItems: imageItems.length > 0 ? imageItems : undefined,
      };

      return project;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 프로젝트 생성 (경매와 동일: multipart/form-data)
   * POST /api/crowd consumes multipart/form-data
   * - data: ProjectRequestDto (JSON) @RequestPart(value = "data")
   * - file: 이미지 파일 목록 @RequestPart(name = "file") List<MultipartFile>
   * 백엔드 응답: Long projectId
   */
  createProject: async (
    files: File[],
    data: ProjectCreateRequest
  ): Promise<ProjectResponse> => {
    try {
      if (!files || files.length === 0) {
        throw new Error('프로젝트 이미지를 최소 1개 이상 업로드해주세요');
      }

      const formData = new FormData();
      const dataPart = {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        startAt: data.startAt,
        endAt: data.endAt,
        categoryPath: data.categoryPath ?? null,
        tags: data.tags ?? null,
        summary: data.summary ?? null,
        rewardTiers: data.rewardTiers.map((tier) => ({
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
        })),
      };
      formData.append('data', new Blob([JSON.stringify(dataPart)], { type: 'application/json' }));
      for (const file of files) {
        formData.append('file', file);
      }

      const projectId = await apiRequest<number>('/api/crowd', {
        method: 'POST',
        body: formData,
      });

      const createdProject = await projectApi.getProject(projectId);
      return createdProject;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 프로젝트 수정 (경매 이미지 저장방식과 동일: multipart/form-data)
   * PATCH /api/crowd/{projectId} consumes multipart/form-data
   * - data: ProjectUpdateRequestDto (JSON) @RequestPart(value = "data")
   * - file: 이미지 파일 목록 @RequestPart(name = "file") List<MultipartFile>
   */
  updateProject: async (
    id: number,
    files: File[],
    data: ProjectUpdateRequest
  ): Promise<ProjectResponse> => {
    try {
      const formData = new FormData();
      const dataPart = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.startAt !== undefined && { startAt: data.startAt }),
        ...(data.endAt !== undefined && { endAt: data.endAt }),
        ...(data.categoryPath !== undefined && { categoryPath: data.categoryPath }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.rewardTiers !== undefined && {
          rewardTiers: data.rewardTiers.map((tier) => ({
            title: tier.title,
            description: tier.description,
            price: tier.price,
            limitQuantity: tier.limitQuantity,
          })),
        }),
        ...(data.imageIds !== undefined &&
          data.imageIds.length > 0 && {
            imageIds: data.imageIds,
          }),
      };
      formData.append('data', new Blob([JSON.stringify(dataPart)], { type: 'application/json' }));

      for (const file of files) {
        formData.append('file', file);
      }

      await apiRequest(`/api/crowd/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      return projectApi.getProject(id);
    } catch (error) {
      throw error;
    }
  },

  /**
   * 펀딩 오픈
   * PATCH /api/crowd/{projectId}/open
   * DRAFT 상태의 프로젝트를 OPEN으로 전환
   */
  openFunding: async (projectId: number): Promise<void> => {
    await apiRequest(`/api/crowd/${projectId}/open`, {
      method: 'PATCH',
    });
  },

  /**
   * 프로젝트 삭제
   * DELETE /api/crowd/{projectId}
   */
  deleteProject: async (id: number): Promise<void> => {
    try {
      await apiRequest(`/api/crowd/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * 프로젝트 후원하기 (하위 호환성 유지)
   * @deprecated createPledge 사용 권장
   */
  supportProject: async (data: SupportRequest): Promise<SupportResponse> => {
    const pledgeResponse = await projectApi.createPledge(data.projectId, {
      items: [{ rewardTierId: data.rewardTierId, quantity: 1 }],
      donateAmount: data.amount - 0, // amount가 리워드 가격과 동일할 수 있음
    });
    return {
      id: pledgeResponse.pledgeId ?? pledgeResponse.id ?? 0,
      projectId: pledgeResponse.projectId,
      projectTitle: pledgeResponse.projectTitle || '',
      rewardTierId: pledgeResponse.rewardTierId,
      rewardTierTitle: pledgeResponse.rewardTierTitle || '',
      amount: pledgeResponse.amount,
      supporter: pledgeResponse.supporter || {
        id: 0,
        email: null,
        name: '',
        nickname: '',
        profileImageUrl: null,
        phone: null,
      },
      createdAt: pledgeResponse.createdAt,
    };
  },

  /**
   * 리워드 구매 (Pledge 생성)
   * POST /api/crowd/pledges/{projectId}
   * 백엔드 PledgeCreateRequestDto: items (List, @NotEmpty) [{ rewardTierId, quantity }]
   */
  createPledge: async (
    projectId: number,
    data: PledgeCreateRequest
  ): Promise<PledgeResponse> => {
    try {
      const items = data.items?.length
        ? data.items
        : (data.rewardTierId != null
            ? [{ rewardTierId: data.rewardTierId, quantity: data.quantity ?? 1 }]
            : []);

      if (items.length === 0) {
        throw new Error('구매할 리워드를 선택해주세요');
      }

      const requestBody = {
        items: items.map((item) => ({
          rewardTierId: Number(item.rewardTierId),
          quantity: Math.max(1, Number(item.quantity) || 1),
        })),
      };

      const backendResponse = await apiRequest<any>(`/api/crowd/pledges/${projectId}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const firstItem = items[0];
      const pledge: PledgeResponse = {
        pledgeId: backendResponse.pledgeId ?? backendResponse.id ?? 0,
        id: backendResponse.pledgeId ?? backendResponse.id,
        projectId: backendResponse.projectId ?? projectId,
        userId: backendResponse.userId,
        rewardTierId: backendResponse.rewardTierId ?? firstItem.rewardTierId,
        amount: backendResponse.amount ?? 0,
        status: backendResponse.status,
        createdAt: backendResponse.createdAt || new Date().toISOString(),
      };

      return pledge;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 본인의 리워드 전체 조회
   * GET /api/crowd/pledges
   * 백엔드 PledgeResponseDto: pledgeId, projectId, userId, rewardTierId, amount, status, createdAt
   */
  getMyPledges: async (): Promise<PledgeResponse[]> => {
    try {
      const backendResponse = await apiRequest<any[]>('/api/crowd/pledges', {
        method: 'GET',
      });

      return backendResponse.map((pledge: any) => ({
        pledgeId: pledge.pledgeId ?? pledge.id ?? 0,
        id: pledge.pledgeId ?? pledge.id,
        projectId: pledge.projectId ?? 0,
        userId: pledge.userId,
        rewardTierId: pledge.rewardTierId ?? 0,
        amount: pledge.amount ?? 0,
        status: pledge.status,
        createdAt: pledge.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * 리워드 취소
   * PATCH /api/crowd/pledges/{pledgeId}/cancel
   */
  cancelPledge: async (pledgeId: number): Promise<void> => {
    try {
      await apiRequest(`/api/crowd/pledges/${pledgeId}/cancel`, {
        method: 'PATCH',
      });
    } catch (error) {
      throw error;
    }
  },

  getMySupports: async (userId?: number): Promise<SupportResponse[]> => {
    return [];
  },

  checkAndUpdateProjectStatus: async (projectId: number): Promise<ProjectResponse | null> => {
    try {
      return await projectApi.getProject(projectId);
    } catch {
      return null;
    }
  },

  checkAllProjectsStatus: async (): Promise<void> => {
    // 백엔드에서 상태 자동 반영; 목록/상세 조회 시 최신 상태 반환
  },

  /**
   * 통계 정보 조회
   * 프로젝트 목록을 가져와서 통계를 계산
   */
  getStatistics: async (): Promise<{
    totalAmount: number;
    totalParticipants: number;
    activeProjects: number;
  }> => {
    try {
      // 모든 프로젝트 조회
      const allProjects = await projectApi.getProjects();
      
      // 누적 후원금액: 모든 프로젝트의 currentAmount 합계
      const totalAmount = allProjects.reduce((sum, project) => {
        return sum + (project.currentAmount || 0);
      }, 0);
      
      // 참여자 수: 모든 프로젝트의 rewardTiers의 soldQuantity 합계 (rewardTiers 없을 수 있음 방어)
      const totalParticipants = allProjects.reduce((sum, project) => {
        const tiers = project.rewardTiers ?? [];
        const participants = tiers.reduce((tierSum, tier) => tierSum + (tier.soldQuantity || 0), 0);
        return sum + participants;
      }, 0);
      
      // 진행 중인 프로젝트: status가 'OPEN'인 프로젝트 수
      const activeProjects = allProjects.filter(
        project => project.status === 'OPEN'
      ).length;
      
      return {
        totalAmount,
        totalParticipants,
        activeProjects,
      };
    } catch {
      return {
        totalAmount: 0,
        totalParticipants: 0,
        activeProjects: 0,
      };
    }
  },

  searchProjects: async (query: string, params?: {
    status?: ProjectResponse['status'];
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    return [];
  },
};
