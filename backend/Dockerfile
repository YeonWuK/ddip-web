# ===== 1) Build stage =====
FROM amazoncorretto:21 AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew --no-daemon clean bootJar

# ===== 2) Run stage =====
FROM amazoncorretto:21
WORKDIR /app

# 빌드 산출물 복사
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]