package com.ddip.backend.validation;

import com.skytracker.validation.ValidationGroups.NotBlankGroups;
import jakarta.validation.GroupSequence;

@GroupSequence(value = {NotBlankGroups.class})
public interface ValidationSequence {
}
