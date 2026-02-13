package com.ddip.backend.project.service;

import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.project.dto.project.ProjectDetailResponseDto;
import com.ddip.backend.project.dto.project.ProjectResponseDto;
import com.ddip.backend.project.exception.project.ProjectNotFoundException;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.user.repository.UserRepository;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectQueryService {

    private final ProjectRepository projectRepository;
    private final ProjectImageService projectImageService;
    private final UserRepository userRepository;

    public Project getProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    public ProjectDetailResponseDto findProjectDetail(Long projectId) {
        Project project = projectRepository.findByIdWithRewardTiers(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        User creator = getUserOrThrow(project.getCreatorId());
        List<ProjectImage> images = projectImageService.findImagesByProjectId(projectId);
        return ProjectDetailResponseDto.from(project, creator, images);
    }

    public List<ProjectResponseDto> getAllProjects() {
        List<Project> projects = projectRepository.findAll();

        Set<Long> creatorIds = projects.stream()
                .map(Project::getCreatorId)
                .collect(Collectors.toSet());

        Map<Long, User> creatorById = userRepository.findAllById(creatorIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return projects.stream()
                .map(project -> {
                    User creator = creatorById.get(project.getCreatorId());
                    if (creator == null) {
                        throw new UserNotFoundException(project.getCreatorId());
                    }
                    return ProjectResponseDto.from(project, creator);
                })
                .toList();
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }
}
