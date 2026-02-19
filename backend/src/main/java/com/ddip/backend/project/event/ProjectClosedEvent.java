package com.ddip.backend.project.event;

public record ProjectClosedEvent(Long projectId, boolean success) {}