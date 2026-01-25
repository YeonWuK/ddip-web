package com.ddip.backend.es.document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(indexName = "project", createIndex = true)
@Setting(settingPath = "elasticsearch/tokenizer-setting.json")
@Mapping(mappingPath = "elasticsearch/project-mapping.json")
public class ProjectDocument {

    @Id
    @Field(type = FieldType.Long)
    private Long id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Long)
    private Long targetAmount;

    @Field(type = FieldType.Long)
    private Long currentAmount;

    @Field(type = FieldType.Text)
    private String status;

    @Field(type = FieldType.Date)
    private LocalDate startAt;

    @Field(type = FieldType.Date)
    private LocalDate endAt;
}