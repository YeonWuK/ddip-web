package com.ddip.backend.project.es.document;

import com.ddip.backend.project.domain.Project;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Setting(settingPath = "elasticsearch/setting.json")
@Mapping(mappingPath = "elasticsearch/project-mapping.json")
@Document(indexName = "project", createIndex = true, writeTypeHint = WriteTypeHint.FALSE)
public class ProjectDocument {

    @Id
    @Field(type = FieldType.Long)
    private Long id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Text, analyzer = "tag_analyzer")
    private String tags;

    @Field(type = FieldType.Keyword)
    private String categoryPath;

    @Field(type = FieldType.Keyword, index = false)
    private String thumbnailUrl;

    @Field(type = FieldType.Long)
    private Long targetAmount;

    @Field(type = FieldType.Long)
    private Long currentAmount;

    @Field(type = FieldType.Long)
    private Long likeCount;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Date)
    private LocalDateTime createdDate;

    @Field(type = FieldType.Date)
    private LocalDate endAt;

    public static ProjectDocument from(Project project, String thumbnailUrl) {
        return ProjectDocument.builder()
                .id(project.getId())
                .title(project.getTitle())
                .summary(project.getSummary())
                .tags(project.getTags())
                .categoryPath(project.getCategoryPath())
                .thumbnailUrl(thumbnailUrl)
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .likeCount(project.getLikeCount())
                .status(project.getStatus().name())
                .createdDate(project.getCreateTime())
                .endAt(project.getEndAt())
                .build();
    }
}