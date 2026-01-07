package com.ddip.backend.validation;

import jakarta.validation.GroupSequence;

@GroupSequence(value = {ValidationGroups.NotBlankGroups.class})
public interface ValidationSequence {
}
