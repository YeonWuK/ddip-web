package com.ddip.backend.common.validation;

import jakarta.validation.GroupSequence;

@GroupSequence(value = {ValidationGroups.NotBlankGroups.class})
public interface ValidationSequence {
}
