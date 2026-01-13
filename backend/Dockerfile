# ===== 1) Build stage =====
FROM amazoncorretto:21 AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew --no-daemon :apps:price-alert:clean :apps:price-alert:bootJar -x test

# ===== 2) Run stage =====
FROM amazoncorretto:21
WORKDIR /app
COPY --from=build /app/apps/price-alert/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]