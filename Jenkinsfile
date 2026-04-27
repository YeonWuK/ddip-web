pipeline {
    agent any

    environment {
        IMAGE_NAME = "seohan02/ddip-backend"
        ES_IMAGE = "seohan02/ddip-elasticsearch"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DEPLOY_DIR = "/home/ubuntu/backend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest ./backend'
                sh 'docker build -t $ES_IMAGE:$IMAGE_TAG -t $ES_IMAGE:latest ./backend/elasticsearch'
            }
        }

        stage('Push Image') {
            steps {
                sh 'docker push $IMAGE_NAME:$IMAGE_TAG'
                sh 'docker push $IMAGE_NAME:latest'
                sh 'docker push $ES_IMAGE:$IMAGE_TAG'
                sh 'docker push $ES_IMAGE:latest'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                cd $DEPLOY_DIR
                docker compose pull
                docker compose up -d
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker logout'
                sh 'docker builder prune -f'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        failure {
            sh 'docker logout || true'
        }
    }
}